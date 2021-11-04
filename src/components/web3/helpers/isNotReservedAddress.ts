import {ESCROW_ADDRESS, GUILD_ADDRESS, TOTAL_ADDRESS} from '../../../config';

/**
 * isNotReservedAddress
 *
 * Checks if a given address is reserved.
 *
 * @param address
 * @returns {boolean}
 *
 * @see `isNotReservedAddress` `DaoHelper.sol`
 */
export function isNotReservedAddress(address: string): boolean {
  return (
    address !== GUILD_ADDRESS &&
    address !== TOTAL_ADDRESS &&
    address !== ESCROW_ADDRESS
  );
}
