import {useEffect, useRef, useState} from 'react';

import {truncateEthAddress} from '../../../util/helpers';
import {ContractAdapterNames, Web3TxStatus} from '../../web3/types';
import {getVoteChosen} from '../helpers';
import {ProposalData} from '../types';
import {StoreState} from '../../../store/types';
import {useMemberActionDisabled} from '../../../hooks';
import {useSelector} from 'react-redux';
import {useSignAndSendVote} from '../hooks';
import {useWeb3Modal} from '../../web3/hooks';
import {VoteChoices} from '@openlaw/snapshot-js-erc712';
import {VotingActionButtons} from '.';
import ErrorMessageWithDetails from '../../common/ErrorMessageWithDetails';

type OffchainVotingActionProps = {
  adapterName?: ContractAdapterNames;
  proposal: ProposalData;
};

type VotingDisabledReasons = {
  addressIsDelegatedMessage: string;
  alreadyVotedMessage: string;
};

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
  const {adapterName, proposal} = props;

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

  /**
   * Our hooks
   */

  const {account} = useWeb3Modal();
  const {signAndSendVote, voteDataStatus} = useSignAndSendVote();
  const voteChosen = getVoteChosen(
    proposal.snapshotProposal?.votes,
    account || ''
  );
  const {
    isDisabled,
    openWhyDisabledModal,
    setOtherDisabledReasons,
    WhyDisabledModal,
  } = useMemberActionDisabled();

  /**
   * Variables
   */

  const proposalHash: string = proposal.snapshotProposal?.idInDAO || '';
  const snapshotProposalId: string =
    proposal.snapshotProposal?.idInSnapshot || '';

  const isInProcess =
    voteDataStatus === Web3TxStatus.AWAITING_CONFIRM ||
    voteDataStatus === Web3TxStatus.PENDING;

  const isDone = voteDataStatus === Web3TxStatus.FULFILLED;

  const isInProcessOrDone = isInProcess || isDone;

  const isSubmitDisabled = isDisabled || isInProcessOrDone;

  const voteChoiceProgress: VoteChoices | undefined = isInProcess
    ? voteChoiceClicked
    : undefined;

  /**
   * Effects
   */

  useEffect(() => {
    // 1. Determine and set local reasons why voting would be disabled

    // Reason: address is delegated
    if (delegateAddress) {
      // Set or unset
      const addressIsDelegatedMessage = isAddressDelegated
        ? getDelegatedAddressMessage(delegateAddress)
        : '';

      votingDisabledReasonsRef.current = {
        ...votingDisabledReasonsRef.current,
        addressIsDelegatedMessage,
      };
    }

    // Reason: already voted
    votingDisabledReasonsRef.current = {
      ...votingDisabledReasonsRef.current,
      alreadyVotedMessage: voteChosen ? 'You have already voted.' : '',
    };

    // 2. Set reasons
    setOtherDisabledReasons(Object.values(votingDisabledReasonsRef.current));
  }, [
    delegateAddress,
    isAddressDelegated,
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
      await proposal.refetchProposalOrDraft();
    } catch (error) {
      setSubmitError(error);
    }
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
        error={submitError}
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
