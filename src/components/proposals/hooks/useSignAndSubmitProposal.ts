import {useState} from 'react';
import {useSelector} from 'react-redux';
import {
  buildDraftMessage,
  buildProposalMessage,
  getDomainDefinition,
  getSpace,
  prepareDraftMessage,
  prepareProposalMessage,
  signMessage,
  SnapshotMessageBase,
  SnapshotMessageProposal,
  SnapshotProposalData,
  SnapshotSubmitBaseReturn,
  SnapshotSubmitProposalReturn,
  SnapshotType,
  submitMessage,
} from '@openlaw/snapshot-js-erc712';

import {
  ContractAdapterNames,
  ContractDAOConfigKeys,
  Web3TxStatus,
} from '../../web3/types';
import {DEFAULT_CHAIN, SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {
  getAdapterAddressFromContracts,
  getDAOConfigEntry,
} from '../../web3/helpers';
import {PRIMARY_TYPE_ERC712} from '../../web3/config';
import {
  ProposalOrDraftSignDataFromType,
  ProposalOrDraftSnapshotType,
} from '../types';
import {StoreState} from '../../../store/types';
import {useWeb3Modal} from '../../web3/hooks/useWeb3Modal';
import {BURN_ADDRESS} from '../../../util/constants';

type SignAndSendData<T extends ProposalOrDraftSnapshotType> = {
  partialProposalData: PrepareAndSignProposalDataParam;
  adapterAddress?: string;
  adapterName?: ContractAdapterNames;
  type: T;
};

type PrepareAndSignProposalDataParam = {
  body: SnapshotProposalData['payload']['body'];
  name: SnapshotProposalData['payload']['name'];
  metadata: SnapshotProposalData['payload']['metadata'];
  /**
   * Helpful for Proposal types when hashes between created Drafts
   * and yet to be created Proposals need to match.
   */
  timestamp?: SnapshotProposalData['timestamp'];
};

type UseSignAndSubmitProposalReturn<T extends ProposalOrDraftSnapshotType> = {
  signAndSendProposal: (
    d: SignAndSendData<T>
  ) => Promise<SignAndSendProposalReturn<T>>;
  proposalData: SignAndSendProposalReturn<T> | undefined;
  proposalSignAndSendError: Error | undefined;
  proposalSignAndSendStatus: Web3TxStatus;
};

type SignAndSendProposalReturn<T extends ProposalOrDraftSnapshotType> = {
  data: ProposalOrDraftSignDataFromType<T>;
  signature: string;
  submitter: string;
  uniqueId: SnapshotSubmitBaseReturn['uniqueId'];
  uniqueIdDraft: SnapshotSubmitProposalReturn['uniqueIdDraft'];
};

/**
 * useSignAndSubmitProposal
 *
 * React hook which prepares proposal data for submission
 * to Snapshot and Tribute and signs it (ERC712)
 *
 * @returns {Promise<UseSignAndSubmitProposalReturn>} An object with the proposal data and the ERC712 signature string.
 */
export function useSignAndSubmitProposal<
  T extends ProposalOrDraftSnapshotType
>(): UseSignAndSubmitProposalReturn<T> {
  /**
   * Selectors
   */

  const daoRegistryAddress = useSelector(
    (state: StoreState) => state.contracts.DaoRegistryContract?.contractAddress
  );
  const daoRegistryInstance = useSelector(
    (state: StoreState) => state.contracts.DaoRegistryContract?.instance
  );
  const contracts = useSelector((state: StoreState) => state.contracts);

  /**
   * Our hooks
   */

  const {account, provider, web3Instance} = useWeb3Modal();

  /**
   * State
   */

  const [proposalData, setProposalData] =
    useState<SignAndSendProposalReturn<T>>();
  const [proposalSignAndSendError, setProposalSignAndSendError] =
    useState<Error>();
  const [proposalSignAndSendStatus, setProposalSignAndSendStatus] =
    useState<Web3TxStatus>(Web3TxStatus.STANDBY);

  /**
   * Functions
   */

  /**
   * A wrapper to clearly separate the running of functions
   * specific to Proposals.
   *
   * @param {SnapshotMessageBase & Partial<SnapshotMessageProposal>} commonData
   * @returns {Promise<SnapshotProposalData>}
   */
  async function buildProposalMessageHelper(
    commonData: SnapshotMessageBase & Partial<SnapshotMessageProposal>
  ): Promise<SnapshotProposalData> {
    if (!SNAPSHOT_HUB_API_URL) {
      throw new Error('No "SNAPSHOT_HUB_API_URL" was found.');
    }

    if (!web3Instance) {
      throw new Error('No Web3 instance was found.');
    }

    const snapshot: number = await web3Instance.eth.getBlockNumber();

    const votingTimeSeconds: number = parseInt(
      await getDAOConfigEntry(
        daoRegistryInstance,
        ContractDAOConfigKeys.offchainVotingVotingPeriod
      )
    );

    return await buildProposalMessage(
      {
        ...commonData,
        votingTimeSeconds,
        snapshot,
      },
      SNAPSHOT_HUB_API_URL
    );
  }

  /**
   * signAndSendProposal
   *
   * Builds the proposal data for submission to Tribute and Snapshot and signs it (ERC712).
   *
   * @returns {Promise<SignAndSendProposalReturn>} An object with the proposal data, signature string, and propsal hash(es) from snapshot-hub.
   */
  async function signAndSendProposal({
    partialProposalData,
    adapterAddress,
    adapterName,
    type,
  }: SignAndSendData<T>): Promise<SignAndSendProposalReturn<T>> {
    try {
      if (!account) {
        throw new Error('No account was found to send.');
      }

      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
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

      if (type !== SnapshotType.draft && type !== SnapshotType.proposal) {
        throw new Error('Handling for type "vote" is not implemented.');
      }

      setProposalSignAndSendStatus(Web3TxStatus.AWAITING_CONFIRM);

      const actionId = adapterAddress
        ? adapterAddress
        : adapterName
        ? getAdapterAddressFromContracts(adapterName, contracts)
        : BURN_ADDRESS;

      const {body, name, metadata, timestamp} = partialProposalData;

      const {data: snapshotSpace} = await getSpace(SNAPSHOT_HUB_API_URL, SPACE);

      const commonData: SnapshotMessageBase = {
        name,
        body,
        metadata,
        token: snapshotSpace.token,
        space: SPACE,
      };

      // 1. Check proposal type and prepare appropriate message
      const message = (
        type === SnapshotType.draft
          ? await buildDraftMessage(commonData, SNAPSHOT_HUB_API_URL)
          : await buildProposalMessageHelper({
              ...commonData,
              timestamp,
            })
      ) as ProposalOrDraftSignDataFromType<T>;

      // 2. Prepare signing data. Snapshot and the contracts will verify this same data against the signature.
      const erc712Message =
        type === SnapshotType.draft
          ? prepareDraftMessage(message)
          : prepareProposalMessage(message as SnapshotProposalData);

      const {domain, types} = getDomainDefinition(
        {...erc712Message, type},
        daoRegistryAddress,
        actionId,
        DEFAULT_CHAIN
      );

      const dataToSign = JSON.stringify({
        types,
        domain,
        primaryType: PRIMARY_TYPE_ERC712,
        message: erc712Message,
      });

      // 3. Sign data
      const signature = await signMessage(provider, account, dataToSign);

      setProposalSignAndSendStatus(Web3TxStatus.PENDING);

      // 3. Send data to snapshot-hub
      const {data} = await submitMessage<SnapshotSubmitProposalReturn>(
        SNAPSHOT_HUB_API_URL,
        account,
        message,
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
        submitter: account,
        uniqueId: data.uniqueId,
        uniqueIdDraft: data.uniqueIdDraft || '',
      };

      setProposalSignAndSendStatus(Web3TxStatus.FULFILLED);
      setProposalData(dataToReturn);

      return dataToReturn;
    } catch (error) {
      setProposalSignAndSendStatus(Web3TxStatus.REJECTED);
      setProposalSignAndSendError(error);

      throw error;
    }
  }

  return {
    proposalData,
    proposalSignAndSendError,
    proposalSignAndSendStatus,
    signAndSendProposal,
  };
}
