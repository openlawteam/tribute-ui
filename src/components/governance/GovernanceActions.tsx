import {OffchainVotingAction, OffchainVotingStatus} from '../proposals/voting';
import {ProposalData} from '../proposals/types';
import {useVotingTimeStartEnd} from '../../hooks';

type GovernanceActionsProps = {
  proposal: ProposalData;
};

export function GovernanceActions(props: GovernanceActionsProps) {
  const {proposal} = props;

  /**
   * Our hooks
   */

  const {
    hasVotingTimeEnded,
    hasVotingTimeStarted,
    votingTimeStartEndInitReady,
  } = useVotingTimeStartEnd(
    proposal.snapshotProposal?.msg.payload.start,
    proposal.snapshotProposal?.msg.payload.end
  );

  /**
   * Render
   */

  return (
    <>
      {votingTimeStartEndInitReady && hasVotingTimeStarted && (
        <OffchainVotingStatus proposal={proposal} />
      )}

      {votingTimeStartEndInitReady &&
        hasVotingTimeStarted &&
        !hasVotingTimeEnded && <OffchainVotingAction proposal={proposal} />}
    </>
  );
}
