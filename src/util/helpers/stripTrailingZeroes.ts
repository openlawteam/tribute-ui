/**
 * stripTrailingZeroes
 *
 * Strips trailing zeros after a decimal if there
 * is 1 or more at the end.
 *
 * Example:
 *
 * 1.10000 => 1.1
 * 1.100100 => 1.1001
 * 1.000 => 1
 * 1 >= 1
 *
 * @param {string | number} data
 * @returns {string}
 * @see https://stackoverflow.com/a/58896161
 */
export function stripTrailingZeroes(data: string | number): string {
  return data
    .toString()
    .replace(/^([\d,]+)$|^([\d,]+)\.0*$|^([\d,]+\.[0-9]*?)0*$/, '$1$2$3');
}
