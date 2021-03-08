import {ProposalFlag} from '../types';
import {proposalHasFlag} from './proposalHasFlag';

describe('proposalHasFlag unit tests', () => {
  test('should return true if flag matches', () => {
    expect(proposalHasFlag(ProposalFlag.EXISTS, '1')).toBe(true);
    expect(proposalHasFlag(ProposalFlag.SPONSORED, '3')).toBe(true);
    expect(proposalHasFlag(ProposalFlag.PROCESSED, '7')).toBe(true);
    expect(proposalHasFlag(ProposalFlag.EXISTS, 1)).toBe(true);
    expect(proposalHasFlag(ProposalFlag.SPONSORED, 3)).toBe(true);
    expect(proposalHasFlag(ProposalFlag.PROCESSED, 7)).toBe(true);
  });

  test('should return false if flag does not match', () => {
    expect(proposalHasFlag(ProposalFlag.EXISTS, '7')).toBe(false);
    expect(proposalHasFlag(ProposalFlag.SPONSORED, '1')).toBe(false);
    expect(proposalHasFlag(ProposalFlag.PROCESSED, '3')).toBe(false);
    expect(proposalHasFlag(ProposalFlag.EXISTS, 7)).toBe(false);
    expect(proposalHasFlag(ProposalFlag.SPONSORED, 1)).toBe(false);
    expect(proposalHasFlag(ProposalFlag.PROCESSED, 3)).toBe(false);
  });
});
