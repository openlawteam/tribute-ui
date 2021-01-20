import {useState} from 'react';
import {useSelector} from 'react-redux';
import {
  buildVoteMessage,
  getDomainDefinition,
  getSpace,
  signMessage,
  SnapshotMessageVote,
  SnapshotVoteData,
  SnapshotVoteProposal,
} from '@openlaw/snapshot-js-erc712';

import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {DEFAULT_CHAIN, SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {getAdapterAddressFromContracts} from '../../web3/helpers';
import {PRIMARY_TYPE_ERC712} from '../../web3/config';
import {StoreState} from '../../../util/types';
import {useWeb3Modal} from '../../web3/hooks/useWeb3Modal';

type PrepareAndSignVoteDataParam = {
  choice: SnapshotMessageVote['choice'];
  /**
   * The address of a delegate voter for a member.
   */
  delegateAddress?: SnapshotMessageVote['metadata']['memberAddress'];
  metadata?: Record<string, any>;
};

type UsePrepareAndSignVoteDataReturn = {
  prepareAndSignVoteData: (
    partialVoteData: PrepareAndSignVoteDataParam,
    adapterName: ContractAdapterNames,
    proposalHash: SnapshotVoteData['payload']['proposalHash']
  ) => Promise<{
    data: SnapshotVoteData;
    signature: string;
  }>;
  proposalData: SnapshotVoteData | undefined;
  proposalDataError: Error | undefined;
  proposalDataStatus: Web3TxStatus;
  proposalSignature: string;
};

/**
 * usePrepareAndSignVoteData
 *
 * React hook which prepares proposal data for submission
 * to Snapshot and Moloch v3 and signs it (ERC712)
 *
 * @returns {Promise<BuildAndSignProposalDataReturn>} An object with the proposal data and the ERC712 signature string.
 */
export function usePrepareAndSignVoteData(): UsePrepareAndSignVoteDataReturn {
  /**
   * Selectors
   */

  const daoRegistryAddress = useSelector(
    (state: StoreState) => state.contracts.DaoRegistryContract?.contractAddress
  );
  const contracts = useSelector((state: StoreState) => state.contracts);

  /**
   * Our hooks
   */

  const {account, provider, web3Instance} = useWeb3Modal();

  /**
   * State
   */

  const [proposalData, setVoteData] = useState<SnapshotVoteData>();
  const [proposalDataError, setProposalDataError] = useState<Error>();
  const [proposalSignature, setProposalSignature] = useState<string>('');
  const [proposalDataStatus, setProposalDataStatus] = useState<Web3TxStatus>(
    Web3TxStatus.STANDBY
  );

  /**
   * Functions
   */

  /**
   * prepareAndSignVoteData
   *
   * Builds the vote data for submission to Moloch v3 and Snapshot and signs it (ERC712).
   *
   * @param {PrepareAndSignVoteDataParam}
   * @param {adapterName} ContractAdapterNames - An adapter's contract address this data is related to.
   *   @note Does not accept voting adapter names.
   * @param {SnapshotVoteData['payload']['proposalHash']} proposalHash - The unique hash of the proposal from snapshot-hub.
   * @returns {Promise<BuildAndSignProposalDataReturn>} An object with the vote data and the ERC712 signature string.
   */
  async function prepareAndSignVoteData(
    partialVoteData: PrepareAndSignVoteDataParam,
    adapterName: ContractAdapterNames,
    proposalHash: SnapshotVoteData['payload']['proposalHash']
  ): Promise<{
    data: SnapshotVoteData;
    signature: string;
  }> {
    try {
      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      if (!account) {
        throw new Error('No account was found.');
      }

      if (!daoRegistryAddress) {
        throw new Error('No "DaoRegistry" address was found.');
      }

      if (!SNAPSHOT_HUB_API_URL) {
        throw new Error('No "SNAPSHOT_HUB_API_URL" was found.');
      }

      setProposalDataStatus(Web3TxStatus.AWAITING_CONFIRM);

      const adapterAddress = getAdapterAddressFromContracts(
        adapterName,
        contracts
      );
      const {choice, delegateAddress, metadata = {}} = partialVoteData;

      const {data: snapshotSpace} = await getSpace(SNAPSHOT_HUB_API_URL, SPACE);

      const voteData: SnapshotMessageVote = {
        chainId: DEFAULT_CHAIN,
        choice,
        metadata: {
          ...metadata,
          memberAddress: delegateAddress || account,
        },
      };

      const voteProposalData: SnapshotVoteProposal = {
        actionId: adapterAddress,
        proposalHash,
        space: SPACE,
        token: snapshotSpace.token,
        verifyingContract: daoRegistryAddress,
      };

      // Check proposal type and get appropriate message
      const message = await buildVoteMessage(
        voteData,
        voteProposalData,
        SNAPSHOT_HUB_API_URL
      );

      const {domain, types} = getDomainDefinition(
        message,
        daoRegistryAddress,
        adapterAddress,
        DEFAULT_CHAIN
      );

      const dataToSign = JSON.stringify({
        types: types,
        domain: domain,
        primaryType: PRIMARY_TYPE_ERC712,
        message: message,
      });

      setProposalDataStatus(Web3TxStatus.AWAITING_CONFIRM);

      const signature = await signMessage(provider, account, dataToSign);

      setProposalDataStatus(Web3TxStatus.FULFILLED);
      setVoteData(message);
      setProposalSignature(signature);

      return {
        data: message,
        signature,
      };
    } catch (error) {
      setProposalDataError(error);

      throw error;
    }
  }

  return {
    prepareAndSignVoteData,
    proposalData,
    proposalDataError,
    proposalDataStatus,
    proposalSignature,
  };
}
