import {ProposalFlag} from '../types';

/**
 * proposalHasFlag
 *
 * @param flagToCheck
 * @param daoProposalFlag
 * @returns {boolean}
 *
 * @see `ProposalFlag` `DaoRegistry.sol`
 * @see `getFlag` `DaoConstants.sol`
 * @see `setFlag` `DaoConstants.sol`
 */
export function proposalHasFlag(
  flagToCheck: ProposalFlag,
  daoProposalFlag: number | string
): boolean {
  return flagToCheck === Math.log2(Number(daoProposalFlag) + 1) - 1;
}
