import {useState, useRef, useEffect, useCallback} from 'react';
import {useSelector} from 'react-redux';

import {CycleEllipsis} from '../feedback';
import {ProposalData, SnapshotProposal} from './types';
import {StoreState} from '../../store/types';
import {TX_CYCLE_MESSAGES} from '../web3/config';
import {useContractSend, useETHGasPrice, useWeb3Modal} from '../web3/hooks';
import {useMemberActionDisabled} from '../../hooks';
import {Web3TxStatus} from '../web3/types';
import CycleMessage from '../feedback/CycleMessage';
import ErrorMessageWithDetails from '../common/ErrorMessageWithDetails';
import EtherscanURL from '../web3/EtherscanURL';
import FadeIn from '../common/FadeIn';
import Loader from '../feedback/Loader';

type ProcessArguments = [
  string, // `dao`
  string // `proposalId`
];

type ProcessActionMembershipProps = {
  disabled?: boolean;
  proposal: ProposalData;
  isProposalPassed: boolean;
};

type ActionDisabledReasons = {
  notProposerMessage: string;
};

/**
 * Cached outside the component to prevent infinite re-renders.
 *
 * The same can be accomplished inside the component using
 * `useState`, `useRef`, etc., depending on the use case.
 */
const useMemberActionDisabledProps = {
  // Anyone can process a proposal - it's just a question of gas payment.
  skipIsActiveMemberCheck: true,
};

export default function ProcessActionMembership(
  props: ProcessActionMembershipProps
) {
  const {
    disabled: propsDisabled,
    proposal: {snapshotProposal},
    isProposalPassed,
  } = props;

  /**
   * State
   */

  const [submitError, setSubmitError] = useState<Error>();
  const [
    membershipProposalAmount,
    setMembershipProposalAmount,
  ] = useState<string>();

  /**
   * Refs
   */

  const actionDisabledReasonsRef = useRef<ActionDisabledReasons>({
    notProposerMessage: '',
  });

  /**
   * Selectors
   */

  const OnboardingContract = useSelector(
    (state: StoreState) => state.contracts?.OnboardingContract
  );
  const daoRegistryAddress = useSelector(
    (s: StoreState) => s.contracts.DaoRegistryContract?.contractAddress
  );

  /**
   * Our hooks
   */

  const {account} = useWeb3Modal();
  const {txEtherscanURL, txIsPromptOpen, txSend, txStatus} = useContractSend();
  const {
    isDisabled,
    openWhyDisabledModal,
    WhyDisabledModal,
    setOtherDisabledReasons,
  } = useMemberActionDisabled(useMemberActionDisabledProps);
  const gasPrices = useETHGasPrice();

  /**
   * Variables
   */

  const isInProcess =
    txStatus === Web3TxStatus.AWAITING_CONFIRM ||
    txStatus === Web3TxStatus.PENDING;
  const isDone = txStatus === Web3TxStatus.FULFILLED;
  const isInProcessOrDone = isInProcess || isDone || txIsPromptOpen;
  const areSomeDisabled = isDisabled || isInProcessOrDone || propsDisabled;

  /**
   * Cached callbacks
   */

  const getMembershipProposalAmountCached = useCallback(
    getMembershipProposalAmount,
    [OnboardingContract, daoRegistryAddress, snapshotProposal]
  );

  /**
   * Effects
   */

  useEffect(() => {
    if (isProposalPassed) {
      getMembershipProposalAmountCached();
    }
  }, [getMembershipProposalAmountCached, isProposalPassed]);

  useEffect(() => {
    if (isProposalPassed) {
      // 1. Determine and set reasons why action would be disabled

      // Reason: For some proposal types, a passed proposal can only be
      // processed by its original proposer (e.g., the owner of the asset to be
      // transferred)

      // Proposals with this restriction will have this value stored in its
      // snapshot metadata.
      const {
        accountAuthorizedToProcessPassedProposal,
      } = (snapshotProposal as SnapshotProposal).msg.payload.metadata;

      if (accountAuthorizedToProcessPassedProposal && account) {
        actionDisabledReasonsRef.current = {
          ...actionDisabledReasonsRef.current,
          notProposerMessage:
            accountAuthorizedToProcessPassedProposal.toLowerCase() !==
            account.toLowerCase()
              ? 'Only the original proposer can process the proposal.'
              : '',
        };
      }

      // 2. Set reasons
      setOtherDisabledReasons(Object.values(actionDisabledReasonsRef.current));
    }
  }, [account, isProposalPassed, setOtherDisabledReasons, snapshotProposal]);

  /**
   * Functions
   */

  async function getMembershipProposalAmount() {
    try {
      if (!snapshotProposal || !OnboardingContract) return;

      const proposalDetails = await OnboardingContract.instance.methods
        .proposals(daoRegistryAddress, snapshotProposal.idInDAO)
        .call();

      setMembershipProposalAmount(proposalDetails.amount);
    } catch (error) {
      console.error(error);
      setMembershipProposalAmount(undefined);
    }
  }

  async function handleSubmit() {
    try {
      if (!daoRegistryAddress) {
        throw new Error('No DAO Registry address was found.');
      }

      if (!snapshotProposal) {
        throw new Error('No Snapshot proposal was found.');
      }

      if (!OnboardingContract) {
        throw new Error('No OnboardingContract found.');
      }

      const processArguments: ProcessArguments = [
        daoRegistryAddress,
        snapshotProposal.idInDAO,
      ];

      const txArguments = {
        from: account || '',
        value: membershipProposalAmount,
        // Set a fast gas price
        ...(gasPrices ? {gasPrice: gasPrices.fast} : null),
      };

      await txSend(
        'processProposal',
        OnboardingContract.instance.methods,
        processArguments,
        txArguments
      );
    } catch (error) {
      setSubmitError(error);
    }
  }

  /**
   * Render
   */

  function renderSubmitStatus(): React.ReactNode {
    // process proposal transaction statuses
    switch (txStatus) {
      case Web3TxStatus.AWAITING_CONFIRM:
        return (
          <>
            Confirm to process the proposal
            <CycleEllipsis />
          </>
        );
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
      {isProposalPassed ? (
        <>
          <div>
            <button
              className="proposaldetails__button"
              disabled={areSomeDisabled}
              onClick={areSomeDisabled ? () => {} : handleSubmit}>
              {isInProcess ? <Loader /> : isDone ? 'Done' : 'Process'}
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
                Why is processing disabled?
              </button>
            )}
          </div>

          <WhyDisabledModal title="Why is processing disabled?" />
        </>
      ) : (
        // If proposal failed there is no reason to process it. So just show
        // nothing.
        <></>
      )}
    </>
  );
}
