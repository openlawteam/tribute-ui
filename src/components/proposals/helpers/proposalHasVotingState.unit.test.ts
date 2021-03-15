import {proposalHasVotingState} from './proposalHasVotingState';
import {VotingState} from '../voting/types';

describe('proposalHasVotingState unit tests', () => {
  test('should return true if state matches', () => {
    // Test with string
    expect(proposalHasVotingState(VotingState.GRACE_PERIOD, '5')).toBe(true);
    expect(proposalHasVotingState(VotingState.IN_PROGRESS, '4')).toBe(true);
    expect(proposalHasVotingState(VotingState.NOT_PASS, '3')).toBe(true);
    expect(proposalHasVotingState(VotingState.NOT_STARTED, '0')).toBe(true);
    expect(proposalHasVotingState(VotingState.PASS, '2')).toBe(true);
    expect(proposalHasVotingState(VotingState.TIE, '1')).toBe(true);

    // Test with number
    expect(proposalHasVotingState(VotingState.GRACE_PERIOD, 5)).toBe(true);
    expect(proposalHasVotingState(VotingState.IN_PROGRESS, 4)).toBe(true);
    expect(proposalHasVotingState(VotingState.NOT_PASS, 3)).toBe(true);
    expect(proposalHasVotingState(VotingState.NOT_STARTED, 0)).toBe(true);
    expect(proposalHasVotingState(VotingState.PASS, 2)).toBe(true);
    expect(proposalHasVotingState(VotingState.TIE, 1)).toBe(true);
  });

  test('should return false if state does not match', () => {
    // Test with string
    expect(proposalHasVotingState(VotingState.GRACE_PERIOD, '4')).toBe(false);
    expect(proposalHasVotingState(VotingState.IN_PROGRESS, '3')).toBe(false);
    expect(proposalHasVotingState(VotingState.NOT_PASS, '2')).toBe(false);
    expect(proposalHasVotingState(VotingState.NOT_STARTED, '5')).toBe(false);
    expect(proposalHasVotingState(VotingState.PASS, '1')).toBe(false);
    expect(proposalHasVotingState(VotingState.TIE, '0')).toBe(false);

    // Test with number
    expect(proposalHasVotingState(VotingState.GRACE_PERIOD, 4)).toBe(false);
    expect(proposalHasVotingState(VotingState.IN_PROGRESS, 3)).toBe(false);
    expect(proposalHasVotingState(VotingState.NOT_PASS, 2)).toBe(false);
    expect(proposalHasVotingState(VotingState.NOT_STARTED, 5)).toBe(false);
    expect(proposalHasVotingState(VotingState.PASS, 1)).toBe(false);
    expect(proposalHasVotingState(VotingState.TIE, 0)).toBe(false);
  });
});
