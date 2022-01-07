import {BURN_ADDRESS} from '../../../util/constants';

/**
 * isNotZeroAddress
 *
 * Checks if a given address is zeroed.
 *
 * @param address
 * @returns {boolean}
 *
 * @see `isNotZeroAddress` `DaoHelper.sol`
 */
export function isNotZeroAddress(address: string): boolean {
  return address !== BURN_ADDRESS;
}
