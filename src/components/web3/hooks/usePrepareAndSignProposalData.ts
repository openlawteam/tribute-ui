import {useState} from 'react';
import {useSelector} from 'react-redux';
import {
  buildDraftMessage,
  buildProposalMessage,
  getDomainDefinition,
  getSpace,
  signMessage,
  SnapshotDraftData,
  SnapshotProposalData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {
  ContractAdapterNames,
  ContractDAOConfigKeys,
  Web3TxStatus,
} from '../types';
import {DEFAULT_CHAIN, SNAPSHOT_HUB_API_URL, SPACE} from '../../../config';
import {getAdapterAddressFromContracts, getDAOConfigEntry} from '../helpers';
import {PRIMARY_TYPE_ERC712} from '../config';
import {StoreState} from '../../../util/types';
import {useWeb3Modal} from './useWeb3Modal';

type PrepareAndSignProposalDataParam = {
  body: SnapshotProposalData['payload']['body'];
  name: SnapshotProposalData['payload']['name'];
  metadata: SnapshotProposalData['payload']['metadata'];
};

type UsePrepareAndSignProposalDataReturn = {
  prepareAndSignProposalData: (
    partialProposalData: PrepareAndSignProposalDataParam,
    adapterName: ContractAdapterNames,
    type: SnapshotProposalData['type']
  ) => Promise<{
    data: SnapshotDraftData;
    signature: string;
  }>;
  proposalData: SnapshotDraftData | undefined;
  proposalDataError: Error | undefined;
  proposalDataStatus: Web3TxStatus;
  proposalSignature: string;
};

/**
 * usePrepareAndSignProposalData
 *
 * @todo THIS FILE IS NOT PRODUCTION-READY (it is untested)!
 *
 * React hook which prepares proposal data for submission
 * to Snapshot and Moloch v3 and signs it (ERC712)
 *
 * @returns {Promise<BuildAndSignProposalDataReturn>} An object with the proposal data and the ERC712 signature string.
 */
export function usePrepareAndSignProposalData(): UsePrepareAndSignProposalDataReturn {
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
  const [proposalDataError, setProposalDataError] = useState<Error>();
  const [proposalSignature, setProposalSignature] = useState<string>('');
  const [proposalDataStatus, setProposalDataStatus] = useState<Web3TxStatus>(
    Web3TxStatus.STANDBY
  );

  /**
   * Functions
   */

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

      setProposalDataStatus(Web3TxStatus.AWAITING_CONFIRM);

      const adapterAddress = getAdapterAddressFromContracts(
        adapterName,
        contracts
      );
      const {body, name, metadata} = partialProposalData;

      const {data: snapshotSpace} = await getSpace(SNAPSHOT_HUB_API_URL, SPACE);

      const snapshot: number = await web3Instance.eth.getBlockNumber();

      const votingTimeSeconds: number = parseInt(
        await getDAOConfigEntry(
          ContractDAOConfigKeys.offchainVotingVotingPeriod,
          daoRegistryInstance
        )
      );

      const commonData = {
        name,
        body,
        metadata,
        token: snapshotSpace.token,
        space: SPACE,
        actionId: adapterAddress,
        chainId: DEFAULT_CHAIN,
        verifyingContract: daoRegistryAddress,
      };

      // Check proposal type and get appropriate message
      const draftMessage =
        type === 'draft'
          ? await buildDraftMessage(commonData, SNAPSHOT_HUB_API_URL)
          : await buildProposalMessage(
              {
                ...commonData,
                votingTimeSeconds,
                snapshot,
              },
              SNAPSHOT_HUB_API_URL
            );

      const {domain, types} = getDomainDefinition(
        draftMessage,
        daoRegistryAddress,
        adapterAddress,
        DEFAULT_CHAIN
      );

      const dataToSign = JSON.stringify({
        types: types,
        domain: domain,
        primaryType: PRIMARY_TYPE_ERC712,
        message: draftMessage,
      });

      const signature = await signMessage(provider, account, dataToSign);

      setProposalDataStatus(Web3TxStatus.AWAITING_CONFIRM);
      setProposalData(proposalData);
      setProposalSignature('signature');

      return {
        data: draftMessage as any,
        signature,
      };
    } catch (error) {
      setProposalDataError(error);

      throw error;
    }
  }

  return {
    prepareAndSignProposalData,
    proposalData,
    proposalDataError,
    proposalDataStatus,
    proposalSignature,
  };
}
