import {useState} from 'react';
import {useSelector} from 'react-redux';
import {
  buildVoteMessage,
  getDomainDefinition,
  getSpace,
  prepareVoteMessage,
  signMessage,
  SnapshotMessageVote,
  SnapshotSubmitBaseReturn,
  SnapshotType,
  SnapshotVoteData,
  SnapshotVoteProposal,
  submitMessage,
  VoteChoicesIndex,
} from '@openlaw/snapshot-js-erc712';

import {BURN_ADDRESS} from '../../../util/constants';
import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {DEFAULT_CHAIN, SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {getAdapterAddressFromContracts} from '../../web3/helpers';
import {PRIMARY_TYPE_ERC712} from '../../web3/config';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from '../../web3/hooks/useWeb3Modal';

type SignAndSendVoteDataParam = {
  choice: SnapshotMessageVote['choice'];
  metadata?: Record<string, any>;
};

type UseSignAndSendVoteReturn = {
  signAndSendVote: (data: {
    partialVoteData: SignAndSendVoteDataParam;
    // e.g. Governance does not have an adpater name
    adapterName?: ContractAdapterNames;
    proposalIdInDAO: SnapshotVoteData['payload']['proposalId'];
    proposalIdInSnapshot: string;
  }) => Promise<SignAndSendVoteReturn>;
  voteData: SignAndSendVoteReturn | undefined;
  voteDataError: Error | undefined;
  voteDataStatus: Web3TxStatus;
};

type SignAndSendVoteReturn = {
  data: SnapshotVoteData;
  signature: string;
  uniqueId: SnapshotSubmitBaseReturn['uniqueId'];
};

/**
 * useSignAndSendVote
 *
 * React hook which prepares proposal data for submission
 * to Snapshot and Tribute and signs it (ERC712)
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

  const contracts = useSelector((s: StoreState) => s.contracts);

  const memberAddress = useSelector(
    (s: StoreState) => s.connectedMember?.memberAddress
  );

  /**
   * Our hooks
   */

  const {account, provider, web3Instance} = useWeb3Modal();

  /**
   * State
   */

  const [voteData, setVoteData] = useState<SignAndSendVoteReturn>();
  const [voteDataError, setVoteDataError] = useState<Error>();
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
  async function signAndSendVote({
    partialVoteData,
    adapterName,
    proposalIdInDAO,
    proposalIdInSnapshot,
  }: {
    partialVoteData: SignAndSendVoteDataParam;
    // e.g. Governance does not have an adpater name
    adapterName?: ContractAdapterNames;
    /**
     * This is the hash of the content as submitted to the DAO.
     * The hash should be the same as the Snapshot draft's, or
     * proposal's (if not submitted as a draft), ID.
     *
     * We need to make sure this matches what has been submitted to
     * the DAO for later signature verifications.
     */
    proposalIdInDAO: SnapshotVoteData['payload']['proposalId'];
    /**
     * Must match a `proposal` type's ID in Snapshot so a `vote` may be attached.
     */
    proposalIdInSnapshot: string;
  }): Promise<SignAndSendVoteReturn> {
    try {
      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      if (!account) {
        throw new Error('No account was found.');
      }

      if (!memberAddress) {
        throw new Error('No member address was found.');
      }

      if (!daoRegistryAddress) {
        throw new Error('No "DaoRegistry" address was found.');
      }

      if (!SNAPSHOT_HUB_API_URL) {
        throw new Error('No "SNAPSHOT_HUB_API_URL" was found.');
      }

      if (!SPACE) {
        throw new Error('No Snapshot "SPACE" was found.');
      }

      setVoteDataStatus(Web3TxStatus.AWAITING_CONFIRM);

      const adapterAddress = adapterName
        ? getAdapterAddressFromContracts(adapterName, contracts)
        : BURN_ADDRESS;

      const {choice, metadata = {}} = partialVoteData;

      const {data: snapshotSpace} = await getSpace(SNAPSHOT_HUB_API_URL, SPACE);

      const voteData: SnapshotMessageVote = {
        chainId: DEFAULT_CHAIN,
        choice,
        metadata: {
          ...metadata,
          /**
           * Must be the true member's address for calculating voting power.
           * It's safest to use our helper Redux value `memberAddress: string`,
           * as it uses `OffchainVoting.memberAddressesByDelegatedKey`.
           */
          memberAddress,
        },
      };

      const voteProposalData: SnapshotVoteProposal = {
        proposalId: proposalIdInDAO,
        space: SPACE,
        token: snapshotSpace.token,
      };

      // 1. Check proposal type and get appropriate message
      const message = await buildVoteMessage(
        voteData,
        voteProposalData,
        SNAPSHOT_HUB_API_URL
      );

      const erc712Message = prepareVoteMessage({
        timestamp: message.timestamp,
        payload: {
          proposalId: message.payload.proposalId,
          choice: VoteChoicesIndex[choice],
        },
      });

      const {domain, types} = getDomainDefinition(
        {...erc712Message, type: SnapshotType.vote},
        daoRegistryAddress,
        adapterAddress,
        DEFAULT_CHAIN
      );

      const dataToSign = JSON.stringify({
        types: types,
        domain: domain,
        primaryType: PRIMARY_TYPE_ERC712,
        message: erc712Message,
      });

      const signature: string = await signMessage(
        provider,
        account,
        dataToSign
      );

      setVoteDataStatus(Web3TxStatus.PENDING);

      // 3. Send data to snapshot-hub
      const {data} = await submitMessage<SnapshotSubmitBaseReturn>(
        SNAPSHOT_HUB_API_URL,
        account,
        {
          ...message,
          payload: {...message.payload, proposalId: proposalIdInSnapshot},
        },
        signature,
        {
          actionId: domain.actionId,
          chainId: domain.chainId,
          verifyingContract: domain.verifyingContract,
          message: erc712Message,
        }
      );

      const dataToReturn = {
        data: message,
        signature,
        uniqueId: data.uniqueId,
      };

      setVoteDataStatus(Web3TxStatus.FULFILLED);
      setVoteData(dataToReturn);

      return dataToReturn;
    } catch (error) {
      const e = error as Error;

      setVoteDataStatus(Web3TxStatus.REJECTED);
      setVoteDataError(e);

      throw error;
    }
  }

  return {
    signAndSendVote,
    voteData,
    voteDataError,
    voteDataStatus,
  };
}
