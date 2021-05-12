import {hasFlag} from './';
import {MemberFlag} from '../types';
import {ProposalFlag} from '../../proposals/types';

describe('hasFlag unit tests', () => {
  test('should return true if proposal flag matches', () => {
    expect(hasFlag(ProposalFlag.EXISTS, '1')).toBe(true);
    expect(hasFlag(ProposalFlag.SPONSORED, '3')).toBe(true);
    expect(hasFlag(ProposalFlag.PROCESSED, '7')).toBe(true);
    expect(hasFlag(ProposalFlag.EXISTS, 1)).toBe(true);
    expect(hasFlag(ProposalFlag.SPONSORED, 3)).toBe(true);
    expect(hasFlag(ProposalFlag.PROCESSED, 7)).toBe(true);
  });

  test('should return false if proposal flag does not match', () => {
    expect(hasFlag(ProposalFlag.EXISTS, '7')).toBe(false);
    expect(hasFlag(ProposalFlag.SPONSORED, '1')).toBe(false);
    expect(hasFlag(ProposalFlag.PROCESSED, '3')).toBe(false);
    expect(hasFlag(ProposalFlag.EXISTS, 7)).toBe(false);
    expect(hasFlag(ProposalFlag.SPONSORED, 1)).toBe(false);
    expect(hasFlag(ProposalFlag.PROCESSED, 3)).toBe(false);
  });

  test('should return true if member flag matches', () => {
    expect(hasFlag(MemberFlag.EXISTS, '1')).toBe(true);
  });

  test('should return false if member flag does not match', () => {
    expect(hasFlag(MemberFlag.EXISTS, '7')).toBe(false);
  });
});
