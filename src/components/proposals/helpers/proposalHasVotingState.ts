import {VotingState} from '../voting/types';

export function proposalHasVotingState(
  votingStateToCheck: VotingState,
  votingState: number | string
): boolean {
  return VotingState[votingState] === VotingState[votingStateToCheck];
}
