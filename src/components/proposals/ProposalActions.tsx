import {ProposalOrDraftSnapshotData, ProposalCombined} from './types';
import {useVotingStartEnd} from './hooks/useVotingStartEnd';
import SponsorAction from './SponsorAction';
import VotingAction from './VotingAction';

type ProposalActionsProps<T extends ProposalOrDraftSnapshotData> = {
  proposal: ProposalCombined<T>;
};

export default function ProposalActions<T extends ProposalOrDraftSnapshotData>(
  props: ProposalActionsProps<T>
) {
  const {proposal} = props;

  /**
   * Our hooks
   */

  const {hasVotingStarted} = useVotingStartEnd(proposal);

  /**
   * Render
   */

  return (
    <div className="proposaldetails__button-container">
      {/* SPONSOR BUTTON */}
      {/* @todo Show this action button if proposal still needs to be sponsored. Assumes voting starts upon sponsorship. There will probably be another data point to condition this on. */}
      {!hasVotingStarted && <SponsorAction />}

      {/* VOTING BUTTONS */}
      {/* @todo Show these action buttons if proposal has been sponsored. Assumes voting starts upon sponsorship. There will probably be another data point to condition this on. */}
      {hasVotingStarted && <VotingAction />}
    </div>
  );
}
