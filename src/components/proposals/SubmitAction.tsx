import {useState, useRef, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {
  CoreProposalVoteChoices,
  prepareVoteProposalData,
  SnapshotType,
} from '@openlaw/snapshot-js-erc712';

import {AsyncStatus} from '../../util/types';
import {getContractByAddress} from '../web3/helpers';
import {ProposalData} from './types';
import {SPACE} from '../../config';
import {StoreState} from '../../store/types';
import {TX_CYCLE_MESSAGES, VOTE_CHOICES} from '../web3/config';
import {useCheckApplicant, useSignAndSubmitProposal} from './hooks';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';
import {useMemberActionDisabled} from '../../hooks';
import {Web3TxStatus} from '../web3/types';
import CycleMessage from '../feedback/CycleMessage';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import EtherscanURL from '../web3/EtherscanURL';
import FadeIn from '../common/FadeIn';
import Loader from '../feedback/Loader';

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

type ProposalDataForDao = {
  body: string;
  choices: CoreProposalVoteChoices;
  end: number;
  name: string;
  sig: string;
  snapshot: number;
  space: string;
  start: number;
  submitter: string;
  timestamp: string;
};

const {FULFILLED} = AsyncStatus;
const {AWAITING_CONFIRM, FULFILLED: WEB3_TX_FULFILLED, PENDING} = Web3TxStatus;
const defaultChoices: CoreProposalVoteChoices = VOTE_CHOICES;

export default function SubmitAction(props: SubmitActionProps) {
  const {
    checkApplicant,
    proposal: {snapshotDraft, snapshotProposal, refetchProposalOrDraft},
  } = props;

  /**
   * Default proposal data for submission to the DAO.
   * This will be used for `proposalDataForDaoRef`.
   */
  const {
    address: signerAddress = '',
    msg: {
      payload: {
        choices: proposalChoices = defaultChoices,
        name: proposalName = '',
        body: proposalBody = '',
        start: proposalStart = 0,
        end: proposalEnd = 0,
        snapshot: proposalSnapshot = 0,
      },
      timestamp: proposalTimestamp = '',
    },
    sig: proposalSig = '',
  } = snapshotProposal || {msg: {payload: {}}};

  /**
   * State
   */

  const [snapshotProposalSubmitted, setSnapshotProposalSubmitted] =
    useState<boolean>((snapshotProposal?.sig.length || '') > 0);

  const proposalDataForDaoRef = useRef<ProposalDataForDao>({
    body: proposalBody,
    choices: proposalChoices,
    end: proposalEnd,
    name: proposalName,
    sig: proposalSig,
    snapshot: proposalSnapshot,
    space: SPACE || '',
    start: proposalStart,
    submitter: signerAddress,
    timestamp: proposalTimestamp,
  });

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
  const {average: gasPrice} = useETHGasPrice();

  const {
    isDisabled,
    openWhyDisabledModal,
    WhyDisabledModal,
    setOtherDisabledReasons,
  } = useMemberActionDisabled();

  const {proposalSignAndSendStatus, signAndSendProposal} =
    useSignAndSubmitProposal<SnapshotType.proposal>();

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
    txStatus === AWAITING_CONFIRM ||
    txStatus === PENDING ||
    proposalSignAndSendStatus === AWAITING_CONFIRM ||
    proposalSignAndSendStatus === PENDING;

  const isDone = snapshotProposalSubmitted
    ? txStatus === WEB3_TX_FULFILLED
    : txStatus === WEB3_TX_FULFILLED &&
      proposalSignAndSendStatus === WEB3_TX_FULFILLED;

  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;

  /**
   * Effects
   */

  useEffect(() => {
    if (checkApplicant && checkApplicantStatus === FULFILLED) {
      // 1. Determine and set reasons why action would be disabled

      /**
       * Reason: If the applicant address is invalid (see `useCheckApplicant`
       * hook for reasons) the `submitProposal` smart contract transaction will
       * fail.
       */
      if (!isApplicantValid && checkApplicantInvalidMsg) {
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

      const actionId: string =
        (snapshotDraft || snapshotProposal)?.actionId || '';

      const contract = getContractByAddress(actionId, contracts);

      if (!contract) {
        throw Error(`No contract was found for action id ${actionId}.`);
      }

      const idForDAO: string =
        (snapshotDraft || snapshotProposal)?.idInDAO || '';

      const submitActionArgs: any[] = (
        snapshotDraft?.msg.payload || snapshotProposal?.msg.payload
      )?.metadata.submitActionArgs;

      // If the Snapshot Proposal has not yet been submitted to Snapshot Hub
      if (!snapshotProposalSubmitted && snapshotDraft) {
        const {
          msg: {
            payload: {
              name: draftName,
              body: draftBody,
              metadata: draftMetadata,
            },
            timestamp: draftTimestamp,
          },
        } = snapshotDraft;

        // Sign and submit draft for snapshot-hub
        const {data, signature, submitter} = await signAndSendProposal({
          partialProposalData: {
            name: draftName,
            body: draftBody,
            metadata: draftMetadata,
            timestamp: draftTimestamp,
          },
          adapterAddress: contract.contractAddress,
          type: SnapshotType.proposal,
        });

        // Set the proposal data for submission to the DAO
        proposalDataForDaoRef.current = {
          body: data.payload.body,
          choices: data.payload.choices,
          end: data.payload.end,
          name: data.payload.name,
          sig: signature,
          snapshot: data.payload.snapshot,
          space: data.space,
          start: data.payload.start,
          submitter,
          timestamp: data.timestamp,
        };

        setSnapshotProposalSubmitted(true);
      }

      const {
        body,
        choices,
        end,
        name,
        sig,
        snapshot,
        space,
        start,
        submitter,
        timestamp,
      } = proposalDataForDaoRef.current;

      /**
       * Prepare `data` argument for submission to DAO
       *
       * For information about which data the smart contract needs for signature verification (e.g. `hashMessage`):
       * @link https://github.com/openlawteam/tribute-contracts/blob/master/contracts/adapters/voting/OffchainVoting.sol
       */
      const preparedVoteVerificationBytes = prepareVoteProposalData(
        {
          payload: {
            body,
            choices,
            end,
            name,
            snapshot: snapshot.toString(),
            start,
          },
          submitter,
          sig,
          space,
          timestamp: parseInt(timestamp),
        },
        web3Instance
      );

      const submitArguments: SubmitArguments = [
        daoRegistryAddress,
        idForDAO,
        ...(submitActionArgs || []),
        preparedVoteVerificationBytes,
      ];

      const txArguments = {
        from: account || '',
        ...(gasPrice ? {gasPrice} : null),
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
      txStatus === AWAITING_CONFIRM ||
      proposalSignAndSendStatus === AWAITING_CONFIRM
    ) {
      return 'Awaiting your confirmation\u2026';
    }

    // Only for chain tx
    switch (txStatus) {
      case PENDING:
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
      case WEB3_TX_FULFILLED:
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

  /**
   * Log-out check applicant error
   *
   * @todo Use logging service
   */
  if (checkApplicantError) {
    console.warn(
      `Error checking if the applicant address is valid: ${checkApplicantError.message}`
    );
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
