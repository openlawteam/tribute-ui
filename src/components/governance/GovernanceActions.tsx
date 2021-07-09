import {OffchainVotingAction, OffchainVotingStatus} from '../proposals/voting';
import {ProposalData} from '../proposals/types';
import {useTimeStartEnd} from '../../hooks';

type GovernanceActionsProps = {
  proposal: ProposalData;
};

export function GovernanceActions(props: GovernanceActionsProps) {
  const {proposal} = props;

  /**
   * Our hooks
   */

  const {hasTimeEnded, hasTimeStarted, timeStartEndInitReady} = useTimeStartEnd(
    proposal.snapshotProposal?.msg.payload.start,
    proposal.snapshotProposal?.msg.payload.end
  );

  /**
   * Render
   */

  return (
    <>
      {timeStartEndInitReady && hasTimeStarted && (
        <OffchainVotingStatus proposal={proposal} />
      )}

      {timeStartEndInitReady && hasTimeStarted && !hasTimeEnded && (
        <OffchainVotingAction proposal={proposal} />
      )}
    </>
  );
}
