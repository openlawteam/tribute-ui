/**
 * formatDecimal
 *
 * A simple formatter with respect for dynamic decimal places
 * from `toFixed(2)` to `toFixed(4)`. If the number provided
 * is less than `0.01`, then `toFixed(4)` is used, else `toFixed(2)`.
 *
 * This may not work for all cases where the number is tiny, as it could
 * result in `"0.0000"`.
 *
 * @param {number} n
 * @returns {string} A `.toFixed()` representation of the decimal number.
 */
export function formatDecimal(n: number): string {
  return n < 0.01 ? n.toFixed(4) : n.toFixed(2);
}
