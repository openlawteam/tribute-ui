import Web3 from 'web3';

export const isSignatureValid = (signature: string) =>
  Web3.utils.isHex(signature);

/**
 * truncateSignature
 *
 * Truncates signature hex string.
 *
 * @param {string} addr
 * @param {number} [maxLength=5]
 * @returns {string}
 */
export function truncateSignature(sig: string, maxLength: number = 5): string {
  if (sig === null || typeof sig === 'undefined') return '---';

  if (isSignatureValid(sig)) {
    const firstSegment = sig.substring(0, maxLength);
    const secondPart = sig.substring(sig.length - 3);
    return firstSegment + '...' + secondPart;
  } else {
    // in case string argument is not actually a hex string
    return sig;
  }
}
