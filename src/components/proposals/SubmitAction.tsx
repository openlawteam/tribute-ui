import {useState, useRef, useEffect} from 'react';
import {useSelector} from 'react-redux';

import {
  prepareVoteProposalData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';
import {getContractByAddress} from '../web3/helpers';
import {ProposalData} from './types';
import {StoreState} from '../../store/types';
import {TX_CYCLE_MESSAGES} from '../web3/config';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';
import {useMemberActionDisabled} from '../../hooks';
import {useCheckApplicant, useSignAndSubmitProposal} from './hooks';
import {Web3TxStatus} from '../web3/types';
import CycleMessage from '../feedback/CycleMessage';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import EtherscanURL from '../web3/EtherscanURL';
import FadeIn from '../common/FadeIn';
import Loader from '../feedback/Loader';
import {AsyncStatus} from '../../util/types';

type SubmitArguments = [
  string, // `dao`
  string, // `proposalId`
  ...any[],
  string // `proposal data`
];

type SubmitActionProps = {
  checkApplicant?: string;
  proposal: ProposalData;
};

type ActionDisabledReasons = {
  invalidApplicantMessage: string;
};

export default function SubmitAction(props: SubmitActionProps) {
  const {
    checkApplicant,
    proposal: {snapshotDraft, refetchProposalOrDraft},
  } = props;

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();

  /**
   * Refs
   */

  const actionDisabledReasonsRef = useRef<ActionDisabledReasons>({
    invalidApplicantMessage: '',
  });

  /**
   * Selectors
   */

  const contracts = useSelector((s: StoreState) => s.contracts);
  const daoRegistryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );

  /**
   * Our hooks
   */

  const {account, web3Instance} = useWeb3Modal();

  const {txEtherscanURL, txIsPromptOpen, txSend, txStatus} = useContractSend();

  const {
    isDisabled,
    openWhyDisabledModal,
    WhyDisabledModal,
    setOtherDisabledReasons,
  } = useMemberActionDisabled();

  const {proposalSignAndSendStatus, signAndSendProposal} =
    useSignAndSubmitProposal<SnapshotType.proposal>();

  const {fast: fastGasPrice} = useETHGasPrice();

  const {
    checkApplicantError,
    checkApplicantInvalidMsg,
    checkApplicantStatus,
    isApplicantValid,
  } = useCheckApplicant(checkApplicant);

  /**
   * Variables
   */

  const isInProcess =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING ||
    proposalSignAndSendStatus === Web3TxStatus.AWAITING_CONFIRM ||
    proposalSignAndSendStatus === Web3TxStatus.PENDING;

  const isDone =
    txStatus === Web3TxStatus.FULFILLED &&
    proposalSignAndSendStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;

  /**
   * Effects
   */

  useEffect(() => {
    if (checkApplicant) {
      // 1. Determine and set reasons why action would be disabled

      // Reason: If the applicant address is invalid (see `useCheckApplicant`
      // hook for reasons) the `submitProposal` smart contract transaction will
      // fail.
      if (checkApplicantError) {
        console.log(
          `Error checking if the applicant address is valid: ${checkApplicantError.message}`
        );
      }

      if (
        checkApplicantStatus === AsyncStatus.FULFILLED &&
        !isApplicantValid &&
        checkApplicantInvalidMsg
      ) {
        actionDisabledReasonsRef.current = {
          ...actionDisabledReasonsRef.current,
          invalidApplicantMessage: checkApplicantInvalidMsg,
        };
      }

      // 2. Set reasons
      setOtherDisabledReasons(Object.values(actionDisabledReasonsRef.current));
    }
  }, [
    checkApplicant,
    checkApplicantError,
    checkApplicantInvalidMsg,
    checkApplicantStatus,
    isApplicantValid,
    setOtherDisabledReasons,
  ]);

  /**
   * Functions
   */

  async function handleSubmit() {
    try {
      if (!daoRegistryAddress) {
        throw new Error('No DAO Registry address was found.');
      }

      if (!snapshotDraft) {
        throw new Error('No Snapshot draft was found.');
      }

      const contract = getContractByAddress(snapshotDraft.actionId, contracts);

      const {
        msg: {
          payload: {name, body, metadata},
          timestamp,
        },
      } = snapshotDraft;

      // Sign and submit draft for snapshot-hub
      const {data, signature} = await signAndSendProposal({
        partialProposalData: {
          name,
          body,
          metadata,
          timestamp,
        },
        adapterAddress: contract.contractAddress,
        type: SnapshotType.proposal,
      });

      /**
       * Prepare `data` argument for submission to DAO
       *
       * For information about which data the smart contract needs for signature verification (e.g. `hashMessage`):
       * @link https://github.com/openlawteam/tribute-contracts/blob/master/contracts/adapters/voting/OffchainVoting.sol
       */
      const preparedVoteVerificationBytes = prepareVoteProposalData(
        {
          payload: {
            name: data.payload.name,
            body: data.payload.body,
            choices: data.payload.choices,
            snapshot: data.payload.snapshot.toString(),
            start: data.payload.start,
            end: data.payload.end,
          },
          sig: signature,
          space: data.space,
          timestamp: parseInt(data.timestamp),
        },
        web3Instance
      );

      const submitArguments: SubmitArguments = [
        daoRegistryAddress,
        snapshotDraft.idInDAO,
        ...(metadata.submitActionArgs || []),
        preparedVoteVerificationBytes,
      ];

      const txArguments = {
        from: account || '',
        ...(fastGasPrice ? {gasPrice: fastGasPrice} : null),
      };

      await txSend(
        'submitProposal',
        contract.instance.methods,
        submitArguments,
        txArguments
      );

      // Update the proposal
      refetchProposalOrDraft();
    } catch (error) {
      setSubmitError(error);
    }
  }

  /**
   * Render
   */

  function renderSubmitStatus(): React.ReactNode {
    // Either Snapshot or chain tx
    if (
      txStatus === Web3TxStatus.AWAITING_CONFIRM ||
      proposalSignAndSendStatus === Web3TxStatus.AWAITING_CONFIRM
    ) {
      return 'Awaiting your confirmation\u2026';
    }

    // Only for chain tx
    switch (txStatus) {
      case Web3TxStatus.PENDING:
        return (
          <>
            <CycleMessage
              intervalMs={2000}
              messages={TX_CYCLE_MESSAGES}
              useFirstItemStart
              render={(message) => {
                return <FadeIn key={message}>{message}</FadeIn>;
              }}
            />

            <EtherscanURL url={txEtherscanURL} isPending />
          </>
        );
      case Web3TxStatus.FULFILLED:
        return (
          <>
            <div>Proposal submitted!</div>

            <EtherscanURL url={txEtherscanURL} />
          </>
        );
      default:
        return null;
    }
  }

  return (
    <>
      <div>
        <button
          className="proposaldetails__button"
          disabled={isDisabled || isInProcessOrDone}
          onClick={isDisabled || isInProcessOrDone ? () => {} : handleSubmit}>
          {isInProcess ? <Loader /> : isDone ? 'Done' : 'Sponsor'}
        </button>

        <ErrorMessageWithDetails
          error={submitError}
          renderText="Something went wrong"
        />

        {/* SUBMIT STATUS */}

        {isInProcessOrDone && (
          <div className="form__submit-status-container">
            {renderSubmitStatus()}
          </div>
        )}

        {isDisabled && (
          <button
            className="button--help-centered"
            onClick={openWhyDisabledModal}>
            Why is sponsoring disabled?
          </button>
        )}
      </div>

      <WhyDisabledModal title="Why is sponsoring disabled?" />
    </>
  );
}
