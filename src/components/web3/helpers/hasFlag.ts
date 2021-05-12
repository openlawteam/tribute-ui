import {MemberFlag} from '../types';
import {ProposalFlag} from '../../proposals/types';

/**
 * hasFlag
 *
 * A quicker alternative than calling `getProposalFlag` or `getMemberFlag` using `Multicall` for every possiblity.
 *
 * @todo Though this is faster, we may want to switch to using the contract and Multicall instead of re-creating the logic.
 *
 * @param flagToCheck
 * @param daoProposalFlag
 * @returns {boolean}
 *
 * @see `ProposalFlag` `DaoRegistry.sol`
 * @see `getFlag` `DaoConstants.sol`
 * @see `setFlag` `DaoConstants.sol`
 */
export function hasFlag(
  flagToCheck: ProposalFlag | MemberFlag,
  daoProposalFlag: number | string
): boolean {
  return flagToCheck === Math.log2(Number(daoProposalFlag) + 1) - 1;
}
