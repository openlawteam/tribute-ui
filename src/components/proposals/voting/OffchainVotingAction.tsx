import {useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import {VoteChoices} from '@openlaw/snapshot-js-erc712';

import {
  useMemberActionDisabled,
  useMemberUnitsAtSnapshot,
} from '../../../hooks';
import {AsyncStatus} from '../../../util/types';
import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {getVoteChosen} from '../helpers';
import {ProposalData} from '../types';
import {StoreState} from '../../../store/types';
import {truncateEthAddress} from '../../../util/helpers';
import {useSignAndSendVote} from '../hooks';
import {useWeb3Modal} from '../../web3/hooks';
import {VotingActionButtons} from '.';
import ErrorMessageWithDetails from '../../common/ErrorMessageWithDetails';

type OffchainVotingActionProps = {
  adapterName?: ContractAdapterNames;
  proposal: ProposalData;
};

type VotingDisabledReasons = {
  addressIsDelegatedMessage: string;
  alreadyVotedMessage: string;
  noMembershipAtSnapshotMessage: string;
  undeterminedMembershipAtSnapshotMessage: string;
};

const {FULFILLED, REJECTED} = AsyncStatus;

const getDelegatedAddressMessage = (a: string) =>
  `Your member address is delegated to ${truncateEthAddress(
    a,
    7
  )}. You must use that address to vote.`;

/**
 * OffchainVotingAction
 *
 * An off-chain voting action component which facilitates submitting to Snapshot Hub.
 *
 * @returns {JSX.Element}
 */
export function OffchainVotingAction(
  props: OffchainVotingActionProps
): JSX.Element | null {
  const {
    adapterName,
    proposal: {snapshotProposal, refetchProposalOrDraft},
  } = props;

  /**
   * State
   */

  const [voteChoiceClicked, setVoteChoiceClicked] = useState<VoteChoices>();
  const [submitError, setSubmitError] = useState<Error>();

  /**
   * Refs
   */

  const votingDisabledReasonsRef = useRef<VotingDisabledReasons>({
    addressIsDelegatedMessage: '',
    alreadyVotedMessage: '',
    noMembershipAtSnapshotMessage: '',
    undeterminedMembershipAtSnapshotMessage: '',
  });

  /**
   * Selectors
   */

  const delegateAddress = useSelector(
    (s: StoreState) => s.connectedMember?.delegateKey
  );

  const isAddressDelegated = useSelector(
    (s: StoreState) => s.connectedMember?.isAddressDelegated
  );

  const memberAddress = useSelector(
    (s: StoreState) => s.connectedMember?.memberAddress
  );

  /**
   * Our hooks
   */

  const {account} = useWeb3Modal();
  const {signAndSendVote, voteDataStatus} = useSignAndSendVote();
  const voteChosen = getVoteChosen(snapshotProposal?.votes, account || '');

  const {
    isDisabled,
    openWhyDisabledModal,
    setOtherDisabledReasons,
    WhyDisabledModal,
  } = useMemberActionDisabled();

  const {
    hasMembershipAtSnapshot,
    memberUnitsAtSnapshotError,
    memberUnitsAtSnapshotStatus,
  } = useMemberUnitsAtSnapshot(
    memberAddress,
    snapshotProposal?.msg.payload.snapshot
  );

  /**
   * Variables
   */

  const proposalHash: string = snapshotProposal?.idInDAO || '';
  const snapshotProposalId: string = snapshotProposal?.idInSnapshot || '';

  const isInProcess =
    voteDataStatus === Web3TxStatus.AWAITING_CONFIRM ||
    voteDataStatus === Web3TxStatus.PENDING;

  const isDone = voteDataStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone = isInProcess || isDone;

  const isSubmitDisabled = isDisabled || isInProcessOrDone;

  const voteChoiceProgress: VoteChoices | undefined = isInProcess
    ? voteChoiceClicked
    : undefined;

  const error: Error | undefined = submitError || memberUnitsAtSnapshotError;

  /**
   * Effects
   */

  useEffect(() => {
    // 1. Determine and set local reasons why voting would be disabled

    // Reason: address is delegated
    if (delegateAddress) {
      setDisabledReasonHelper(
        'addressIsDelegatedMessage',
        isAddressDelegated ? getDelegatedAddressMessage(delegateAddress) : ''
      );
    }

    // Reason: already voted
    setDisabledReasonHelper(
      'alreadyVotedMessage',
      voteChosen ? 'You have already voted.' : ''
    );

    // Reason: did not hold membership by snapshot
    setDisabledReasonHelper(
      'noMembershipAtSnapshotMessage',
      !hasMembershipAtSnapshot && memberUnitsAtSnapshotStatus === FULFILLED
        ? 'You were not a member when the proposal was sponsored.'
        : ''
    );

    // Reason: cannot determine membership by snapshot
    setDisabledReasonHelper(
      'undeterminedMembershipAtSnapshotMessage',
      memberUnitsAtSnapshotStatus === REJECTED
        ? 'Your membership status at the time this proposal was sponsored cannot be determined.'
        : ''
    );

    // 2. Set reasons
    setOtherDisabledReasons(Object.values(votingDisabledReasonsRef.current));
  }, [
    delegateAddress,
    hasMembershipAtSnapshot,
    isAddressDelegated,
    memberUnitsAtSnapshotStatus,
    setOtherDisabledReasons,
    voteChosen,
  ]);

  /**
   * Functions
   */

  async function handleSubmitVote(choice: VoteChoices) {
    try {
      if (!proposalHash) {
        throw new Error('No proposal hash was found.');
      }

      if (!snapshotProposalId) {
        throw new Error('No proposal ID was found.');
      }

      setVoteChoiceClicked(VoteChoices[choice]);

      await signAndSendVote({
        ...(adapterName ? {adapterName} : undefined),
        partialVoteData: {choice},
        proposalIdInDAO: proposalHash,
        proposalIdInSnapshot: snapshotProposalId,
      });

      // Refetch to show the vote the user submitted
      await refetchProposalOrDraft();
    } catch (error) {
      setSubmitError(error);
    }
  }

  function setDisabledReasonHelper(
    key: keyof VotingDisabledReasons,
    message: string
  ): void {
    votingDisabledReasonsRef.current = {
      ...votingDisabledReasonsRef.current,

      [key]: message,
    };
  }

  return (
    <>
      <VotingActionButtons
        onClick={isSubmitDisabled ? () => {} : handleSubmitVote}
        buttonProps={{
          disabled: isSubmitDisabled,
          'aria-disabled': isSubmitDisabled,
        }}
        voteChosen={voteChosen}
        voteProgress={voteChoiceProgress}
      />

      <ErrorMessageWithDetails
        error={error}
        renderText="Something went wrong"
      />

      {isDisabled && (
        <button
          className="button--help-centered"
          onClick={openWhyDisabledModal}>
          Why is voting disabled?
        </button>
      )}

      <WhyDisabledModal title="Why is voting disabled?" />
    </>
  );
}
