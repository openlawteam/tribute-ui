import {useState} from 'react';
import {useSelector} from 'react-redux';

import {CoreProposalData, CoreProposalType, Web3TxStatus} from '../types';
import {DEFAULT_CHAIN, SPACE} from '../../../config';
import {StoreState} from '../../../util/types';
import {useWeb3Modal} from './useWeb3Modal';
import {VOTE_CHOICES} from '../config';

const {Web3JsSigner} = require('../../../laoland/offchain_voting');

type BuildAndSignProposalDataParam = {
  body: CoreProposalData['payload']['body'];
  name: CoreProposalData['payload']['name'];
};

type UseBuildAndSignProposalDataReturn = {
  buildAndSignProposalData: (
    d: BuildAndSignProposalDataParam
  ) => Promise<CoreProposalData>;
  proposalData: CoreProposalData | undefined;
  proposalDataStatus: Web3TxStatus;
};

/**
 * useBuildAndSignProposalData
 *
 * @todo THIS FILE IS NOT PRODUCTION-READY (it is a WIP)!
 *
 * React hook which returns a function, and its data, to builds the proposal data for submission
 * to Moloch v3 and Snapshot and signs it (ERC712).
 *
 * @note
 * The decision to make this a hook seems correct for the React context which it is used.
 * It's a pain to have a pure function that requires so many dependencies, so hooks help us keep
 * the usage uncluttered and less annoying.
 *
 * @returns {Promise<BuildAndSignProposalDataReturn>} An object with the proposal data and the ERC712 signature string.
 */
export function useBuildAndSignProposalData(): UseBuildAndSignProposalDataReturn {
  /**
   * Selectors
   */

  const onboardingAddress = useSelector(
    (state: StoreState) => state.contracts.OnboardingContract?.contractAddress
  );
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
  const [proposalDataStatus, setProposalDataStatus] = useState<Web3TxStatus>(
    Web3TxStatus.STANDBY
  );

  /**
   * Functions
   */

  /**
   * buildAndSignProposalData
   *
   * Builds the proposal data for submission to Moloch v3 and Snapshot and signs it (ERC712).
   *
   * @param {BuildAndSignProposalDataParam}
   * @returns {Promise<BuildAndSignProposalDataReturn>} An object with the proposal data and the ERC712 signature string.
   */
  async function buildAndSignProposalData(
    partialProposalData: BuildAndSignProposalDataParam
  ): Promise<CoreProposalData> {
    try {
      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      setProposalDataStatus(Web3TxStatus.AWAITING_CONFIRM);

      const {body, name} = partialProposalData;

      const nowTimestamp: number = Math.floor(Date.now() / 1000);

      const proposalData: CoreProposalData = {
        payload: {
          body,
          choices: VOTE_CHOICES,
          name,
        },
        // Set to empty until we obtain the signature.
        sig: '',
        space: SPACE,
        timestamp: nowTimestamp,
        type: CoreProposalType.draft,
      };

      const signature = await Web3JsSigner(web3Instance, account)(
        proposalData,
        daoRegistryAddress,
        onboardingAddress,
        /**
         * So we don't have the wrong chain, using the environemnt config value,
         * instead of the dynamic `networkId` from `useWeb3Modal`.
         */
        DEFAULT_CHAIN
      );

      // Set the signature
      proposalData.sig = signature;

      setProposalData(proposalData);
      setProposalDataStatus(Web3TxStatus.FULFILLED);

      return proposalData;
    } catch (error) {
      throw error;
    }
  }

  return {
    buildAndSignProposalData,
    proposalData,
    proposalDataStatus,
  };
}
