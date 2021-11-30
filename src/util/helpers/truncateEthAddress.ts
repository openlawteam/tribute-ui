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
  address: string,
  maxLength: number = 5
): string {
  // Fallback if empty `address`
  if (!address) return '---';

  // In case `address` is not an Ethereum address
  if (!isEthAddressValid(address)) {
    return address;
  }

  const firstSegment = address.substring(0, maxLength);
  const secondPart = address.substring(address.length - 4);

  return `${firstSegment}...${secondPart}`;
}
