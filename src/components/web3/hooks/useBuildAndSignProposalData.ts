import {useState} from 'react';
import {useSelector} from 'react-redux';

import {CoreProposalData, Web3TxStatus} from '../types';
import {SPACE} from '../../../config';
import {StoreState} from '../../../util/types';
import {VOTE_CHOICES, VOTE_LENGTH_SECONDS} from '../config';

const {Web3JsSigner} = require('../../../laoland/offchain_voting');

type BuildAndSignProposalDataParam = {
  body: CoreProposalData['payload']['body'];
  /**
   * For custom vote `end`; otherwise defaults to environment's config value.
   */
  end?: CoreProposalData['payload']['end'];
  name: CoreProposalData['payload']['name'];
};

type BuildAndSignProposalDataReturn = {
  proposalData: CoreProposalData;
  signature: string;
};

type UseBuildAndSignProposalDataReturn = {
  buildAndSignProposalData: (
    d: BuildAndSignProposalDataParam
  ) => Promise<BuildAndSignProposalDataReturn>;
  proposalData: CoreProposalData | undefined;
  proposalDataStatus: Web3TxStatus;
  proposalSignature: BuildAndSignProposalDataReturn['signature'];
};

/**
 * useBuildAndSignProposalData
 *
 * React hook which returns a function, and its data, to builds the proposal data for submission
 * to Moloch v3 and Snapshot and signs it (ERC712).
 *
 * @note
 * The decision to make this a hook seems correct for the React context which it is used.
 * It's a pain to have a function that requires so many dependencies, so hooks help us keep
 * the usage uncluttered and less annoying.
 *
 * @returns {Promise<BuildAndSignProposalDataReturn>} An object with the proposal data and the ERC712 signature string.
 */
export function useBuildAndSignProposalData(): UseBuildAndSignProposalDataReturn {
  /**
   * Selectors
   */

  const account = useSelector((s: StoreState) => s.blockchain.connectedAddress);
  const web3Instance = useSelector(
    (s: StoreState) => s.blockchain.web3Instance
  );
  const chainId = useSelector(
    (s: StoreState) => s.blockchain && s.blockchain.defaultChain
  );
  const onboardingAddress = useSelector(
    (state: StoreState) =>
      state.blockchain.contracts &&
      state.blockchain.contracts.OnboardingContract.contractAddress
  );
  const daoRegistryAddress = useSelector(
    (state: StoreState) =>
      state.blockchain.contracts &&
      state.blockchain.contracts.DaoRegistryContract.contractAddress
  );

  /**
   * State
   */

  const [proposalData, setProposalData] = useState<CoreProposalData>();
  const [proposalSignature, setProposalSignature] = useState<string>('');
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
  ): Promise<BuildAndSignProposalDataReturn> {
    try {
      if (!web3Instance) {
        throw new Error('No Web3 instance was found.');
      }

      setProposalDataStatus(Web3TxStatus.AWAITING_CONFIRM);

      const {body, end, name} = partialProposalData;

      const blockNumber: string = (
        await web3Instance.eth.getBlockNumber()
      ).toString();

      const nowTimestamp: number = Math.floor(Date.now() / 1000);

      const proposalData: CoreProposalData = {
        payload: {
          body,
          choices: VOTE_CHOICES,
          end: end || Math.floor(nowTimestamp / 1000 + VOTE_LENGTH_SECONDS),
          name,
          snapshot: blockNumber,
          start: Math.floor(nowTimestamp / 1000),
        },
        // Set to empty until we obtain the signature.
        sig: '',
        space: SPACE,
        timestamp: nowTimestamp,
        type: 'proposal',
      };

      const signature = await Web3JsSigner(web3Instance, account)(
        proposalData,
        daoRegistryAddress,
        onboardingAddress,
        chainId
      );

      setProposalData(proposalData);
      setProposalSignature(signature);
      setProposalDataStatus(Web3TxStatus.FULFILLED);

      return {
        proposalData,
        signature,
      };
    } catch (error) {
      throw error;
    }
  }

  return {
    buildAndSignProposalData,
    proposalData,
    proposalDataStatus,
    proposalSignature,
  };
}
