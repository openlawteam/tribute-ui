import {OffchainVotingAction, OffchainVotingStatus} from '../proposals/voting';
import {ProposalData} from '../proposals/types';
import {useOffchainVotingStartEnd} from '../proposals/hooks';

type GovernanceActionsProps = {
  proposal: ProposalData;
};

export function GovernanceActions(props: GovernanceActionsProps) {
  const {proposal} = props;

  /**
   * Our hooks
   */

  const {
    hasOffchainVotingEnded,
    hasOffchainVotingStarted,
    offchainVotingStartEndInitReady,
  } = useOffchainVotingStartEnd(proposal);

  /**
   * Render
   */

  return (
    <>
      {offchainVotingStartEndInitReady && hasOffchainVotingStarted && (
        <OffchainVotingStatus proposal={proposal} />
      )}

      {offchainVotingStartEndInitReady &&
        hasOffchainVotingStarted &&
        !hasOffchainVotingEnded && <OffchainVotingAction proposal={proposal} />}
    </>
  );
}
