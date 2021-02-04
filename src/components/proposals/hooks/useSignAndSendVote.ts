import {useState} from 'react';
import {useSelector} from 'react-redux';
import {
  buildVoteMessage,
  getDomainDefinition,
  getSpace,
  prepareVoteMessage,
  signMessage,
  SnapshotMessageVote,
  SnapshotVoteData,
  SnapshotVoteProposal,
  VoteChoicesIndex,
} from '@openlaw/snapshot-js-erc712';

import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {DEFAULT_CHAIN, SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {getAdapterAddressFromContracts} from '../../web3/helpers';
import {PRIMARY_TYPE_ERC712} from '../../web3/config';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from '../../web3/hooks/useWeb3Modal';

type SignAndSendVoteDataParam = {
  choice: SnapshotMessageVote['choice'];
  /**
   * The address of a delegate voter for a member.
   */
  delegateAddress?: SnapshotMessageVote['metadata']['memberAddress'];
  metadata?: Record<string, any>;
};

type UseSignAndSendVoteReturn = {
  signAndSendVote: (
    partialVoteData: SignAndSendVoteDataParam,
    adapterName: ContractAdapterNames,
    proposalHash: SnapshotVoteData['payload']['proposalHash']
  ) => Promise<{
    data: SnapshotVoteData;
    signature: string;
  }>;
  voteData: SnapshotVoteData | undefined;
  voteDataError: Error | undefined;
  voteDataStatus: Web3TxStatus;
  voteSignature: string;
};

/**
 * useSignAndSendVote
 *
 * React hook which prepares proposal data for submission
 * to Snapshot and Moloch v3 and signs it (ERC712)
 *
 * @returns {Promise<BuildAndSignProposalDataReturn>} An object with the proposal data and the ERC712 signature string.
 */
export function useSignAndSendVote(): UseSignAndSendVoteReturn {
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

  const [voteData, setVoteData] = useState<SnapshotVoteData>();
  const [voteDataError, setVoteDataError] = useState<Error>();
  const [voteSignature, setVoteSignature] = useState<string>('');
  const [voteDataStatus, setVoteDataStatus] = useState<Web3TxStatus>(
    Web3TxStatus.STANDBY
  );

  /**
   * Functions
   */

  /**
   * signAndSendVote
   *
   * Builds the vote data for submission to Snapshot and signs it (ERC712).
   *
   * @param {SignAndSendVoteDataParam}
   * @param {adapterName} ContractAdapterNames - An adapter's contract address this data is related to.
   *   @note Does not accept voting adapter names.
   * @param {SnapshotVoteData['payload']['proposalHash']} proposalHash - The unique hash of the proposal from snapshot-hub.
   * @returns {Promise<BuildAndSignProposalDataReturn>} An object with the vote data and the ERC712 signature string.
   */
  async function signAndSendVote(
    partialVoteData: SignAndSendVoteDataParam,
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

      setVoteDataStatus(Web3TxStatus.AWAITING_CONFIRM);

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
        proposalHash,
        space: SPACE,
        token: snapshotSpace.token,
      };

      // 1. Check proposal type and get appropriate message
      const message = await buildVoteMessage(
        voteData,
        voteProposalData,
        SNAPSHOT_HUB_API_URL
      );

      prepareVoteMessage({
        timestamp: message.timestamp,
        payload: {
          proposalHash: message.payload.proposalHash,
          choice: VoteChoicesIndex[choice],
        },
      });

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

      setVoteDataStatus(Web3TxStatus.AWAITING_CONFIRM);

      const signature = await signMessage(provider, account, dataToSign);

      setVoteDataStatus(Web3TxStatus.FULFILLED);
      setVoteData(message);
      setVoteSignature(signature);

      return {
        data: message,
        signature,
      };
    } catch (error) {
      setVoteDataError(error);

      throw error;
    }
  }

  return {
    signAndSendVote,
    voteData,
    voteDataError,
    voteDataStatus,
    voteSignature,
  };
}
