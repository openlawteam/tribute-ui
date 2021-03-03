import {isEthAddressValid} from '../validation';

/**
 * truncateEthAddress
 *
 * Truncates Ethereum address.
 *
 * @param {string} addr
 * @param {number} [maxLength=5]
 * @returns {string}
 */
export function truncateEthAddress(
  addr: string,
  maxLength: number = 5
): string {
  if (addr === null || typeof addr === 'undefined') return '---';

  if (isEthAddressValid(addr)) {
    const firstSegment = addr.substring(0, maxLength);
    const secondPart = addr.substring(addr.length - 3);
    return firstSegment + '...' + secondPart;
  } else {
    // in case string argument is not actually an Ethereum address
    return addr;
  }
}
