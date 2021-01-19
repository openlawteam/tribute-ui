import {useState} from 'react';
import {useSelector} from 'react-redux';
import {
  buildDraftMessage,
  buildProposalMessage,
  getDomainDefinition,
  getSpace,
  signMessage,
  SnapshotDraftData,
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
} from '../types';
import {DEFAULT_CHAIN, SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {getAdapterAddressFromContracts, getDAOConfigEntry} from '../helpers';
import {PRIMARY_TYPE_ERC712} from '../config';
import {AsyncStatus, StoreState} from '../../../util/types';
import {useWeb3Modal} from './useWeb3Modal';

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

type UseSignAndSubmitProposalReturn = {
  prepareAndSignProposalData: (
    partialProposalData: PrepareAndSignProposalDataParam,
    adapterName: ContractAdapterNames,
    type: SnapshotProposalData['type']
  ) => Promise<{
    data: SnapshotDraftData;
    signature: string;
  }>;
  proposalData: SnapshotDraftData | undefined;
  proposalHashData:
    | SnapshotSubmitProposalReturn
    | SnapshotSubmitBaseReturn
    | undefined;
  proposalSubmitStatus: AsyncStatus;
  proposalSignError: Error | undefined;
  proposalSignStatus: Web3TxStatus;
  proposalSubmitError: Error | undefined;
  submitProposal: <
    T extends SnapshotSubmitProposalReturn | SnapshotSubmitBaseReturn
  >() => Promise<T>;
};

/**
 * useSignAndSubmitProposal
 *
 * React hook which prepares proposal data for submission
 * to Snapshot and Moloch v3 and signs it (ERC712)
 *
 * @returns {Promise<UseSignAndSubmitProposalReturn>} An object with the proposal data and the ERC712 signature string.
 */
export function useSignAndSubmitProposal(): UseSignAndSubmitProposalReturn {
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

  const [proposalData, setProposalData] = useState<SnapshotDraftData>();
  const [proposalHashData, setProposalHashData] = useState<
    SnapshotSubmitProposalReturn | SnapshotSubmitBaseReturn
  >();
  const [proposalSignError, setProposalSignError] = useState<Error>();
  const [proposalSubmitError, setProposalSubmitError] = useState<Error>();
  const [proposalSignature, setProposalSignature] = useState<string>('');
  const [proposalSignStatus, setProposalSignStatus] = useState<Web3TxStatus>(
    Web3TxStatus.STANDBY
  );
  const [proposalSubmitStatus, setProposalSubmitStatus] = useState<AsyncStatus>(
    AsyncStatus.STANDBY
  );

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

    const snapshot: number = await web3Instance.eth.getBlockNumber();

    const votingTimeSeconds: number = parseInt(
      await getDAOConfigEntry(
        ContractDAOConfigKeys.offchainVotingVotingPeriod,
        daoRegistryInstance
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
   * prepareAndSignProposalData
   *
   * Builds the proposal data for submission to Moloch v3 and Snapshot and signs it (ERC712).
   *
   * @param {PrepareAndSignProposalDataParam}
   * @param {adapterName} ContractAdapterNames - An adapter's contract address this data is related to.
   *   @note Does not accept voting adapter names.
   * @returns {Promise<BuildAndSignProposalDataReturn>} An object with the proposal data and the ERC712 signature string.
   */
  async function prepareAndSignProposalData(
    partialProposalData: PrepareAndSignProposalDataParam,
    adapterName: ContractAdapterNames,
    type: SnapshotType
  ): Promise<{
    data: SnapshotDraftData;
    signature: string;
  }> {
    try {
      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      if (!daoRegistryAddress) {
        throw new Error('No "DaoRegistry" address was found.');
      }

      if (!SNAPSHOT_HUB_API_URL) {
        throw new Error('No "SNAPSHOT_HUB_API_URL" was found.');
      }

      if (type === SnapshotType.vote) {
        throw new Error('Handling for type "vote" is not implemented.');
      }

      setProposalSignStatus(Web3TxStatus.AWAITING_CONFIRM);

      const adapterAddress = getAdapterAddressFromContracts(
        adapterName,
        contracts
      );
      const {body, name, metadata, timestamp} = partialProposalData;

      const {data: snapshotSpace} = await getSpace(SNAPSHOT_HUB_API_URL, SPACE);

      const commonData: SnapshotMessageBase = {
        name,
        body,
        metadata,
        token: snapshotSpace.token,
        space: SPACE,
        actionId: adapterAddress,
        chainId: DEFAULT_CHAIN,
        verifyingContract: daoRegistryAddress,
      };

      // 1. Check proposal type and prepare appropriate message
      const message =
        type === 'draft'
          ? await buildDraftMessage(commonData, SNAPSHOT_HUB_API_URL)
          : await buildProposalMessageHelper({
              ...commonData,
              timestamp,
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

      setProposalSignStatus(Web3TxStatus.AWAITING_CONFIRM);

      // 2. Sign data
      const signature = await signMessage(provider, account, dataToSign);

      setProposalSignStatus(Web3TxStatus.FULFILLED);
      setProposalData(message);
      setProposalSignature(signature);

      return {
        data: message,
        signature,
      };
    } catch (error) {
      setProposalSignError(error);

      throw error;
    }
  }

  async function submitProposal<
    T extends SnapshotSubmitProposalReturn | SnapshotSubmitBaseReturn
  >() {
    try {
      if (!account) {
        throw new Error('No account was found to send.');
      }

      if (!proposalData) {
        throw new Error('No proposal data was found to send.');
      }

      if (!SNAPSHOT_HUB_API_URL) {
        throw new Error('No "SNAPSHOT_HUB_API_URL" was found to send.');
      }

      if (!proposalSignature) {
        throw new Error('No signature was found to send.');
      }

      setProposalSubmitStatus(AsyncStatus.PENDING);

      const {data} = await submitMessage<T>(
        SNAPSHOT_HUB_API_URL,
        account,
        proposalData,
        proposalSignature
      );

      setProposalSubmitStatus(AsyncStatus.FULFILLED);
      setProposalHashData(data);

      return data;
    } catch (error) {
      setProposalSubmitStatus(AsyncStatus.REJECTED);
      setProposalSubmitError(error);

      throw error;
    }
  }

  return {
    prepareAndSignProposalData,
    proposalData,
    proposalHashData,
    proposalSubmitStatus,
    proposalSignError,
    proposalSignStatus,
    proposalSubmitError,
    submitProposal,
  };
}
