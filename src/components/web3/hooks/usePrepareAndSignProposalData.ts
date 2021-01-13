import {useState} from 'react';
import {useSelector} from 'react-redux';

import {CoreProposalData, CoreProposalType, Web3TxStatus} from '../types';
import {DEFAULT_CHAIN, SPACE} from '../../../config';
import {StoreState} from '../../../util/types';
import {useWeb3Modal} from './useWeb3Modal';
import {VOTE_CHOICES} from '../config';

const {Web3JsSigner} = require('../../../laoland/offchain_voting');

type PrepareAndSignProposalDataParam = {
  body: CoreProposalData['payload']['body'];
  name: CoreProposalData['payload']['name'];
  metadata: CoreProposalData['payload']['metadata'];
};

type UsePrepareAndSignProposalDataReturn = {
  prepareAndSignProposalData: (
    partialProposalData: PrepareAndSignProposalDataParam,
    adapterAddress: string
  ) => Promise<{
    data: CoreProposalData;
    signature: string;
  }>;
  proposalData: CoreProposalData | undefined;
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
 * to Moloch v3 and Snapshot and signs it (ERC712).
 *
 * @note
 * The decision to make this a hook (instead of a helper function) seems correct for the React context which it is used.
 * If needed, we can always extract `function prepareAndSignProposalData` into its own helper and use it here.
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

  /**
   * Our hooks
   */

  const {account, web3Instance} = useWeb3Modal();

  /**
   * State
   */

  const [proposalData, setProposalData] = useState<CoreProposalData>();
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
   * @param {string} adapterAddress - An adapter's contract address this data is related to.
   * @returns {Promise<BuildAndSignProposalDataReturn>} An object with the proposal data and the ERC712 signature string.
   */
  async function prepareAndSignProposalData(
    partialProposalData: PrepareAndSignProposalDataParam,
    adapterAddress: string
  ): Promise<{
    data: CoreProposalData;
    signature: string;
  }> {
    try {
      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      if (!daoRegistryAddress) {
        throw new Error('No "DaoRegistry" address was found.');
      }

      setProposalDataStatus(Web3TxStatus.AWAITING_CONFIRM);

      const {body, name} = partialProposalData;
      const nowTimestamp: number = Math.floor(Date.now() / 1000);

      // Shape data
      const proposalData: CoreProposalData = {
        actionId: adapterAddress,
        chainId: DEFAULT_CHAIN,
        payload: {
          body,
          choices: VOTE_CHOICES,
          name,
          metadata: {},
        },
        space: SPACE,
        timestamp: nowTimestamp,
        token: daoRegistryAddress,
        type: CoreProposalType.draft,
        verifyingContract: daoRegistryAddress,
      };

      // Sign
      // @todo USE LAOLAND CLIENT EXMAPLE CODE FOR SIGNING. THIS DOES NOT WORK.
      const signature = await Web3JsSigner(web3Instance, account)(
        proposalData,
        daoRegistryAddress,
        adapterAddress,
        /**
         * So we don't get the wrong chain, we get the environemnt config value,
         * instead of the dynamic `networkId` from `useWeb3Modal`.
         */
        DEFAULT_CHAIN
      );

      setProposalDataStatus(Web3TxStatus.AWAITING_CONFIRM);
      setProposalData(proposalData);
      setProposalSignature(signature);

      return {
        data: proposalData,
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
