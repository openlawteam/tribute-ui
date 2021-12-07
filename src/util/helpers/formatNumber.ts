/**
 * formatNumber
 *
 * Formats a number (U.S. region) with commas (e.g. 1000 -> 1,000).
 *
 * If an error occurs while converting to a `Number` the original value
 * is attempted to be converted to a `string` and returned.
 *
 * @param {string | number} value
 * @returns {string}
 */
export const formatNumber = (value: number | string): string => {
  const number: number = Number(value ?? undefined);

  if (isNaN(number)) {
    return '';
  }

  return number.toLocaleString('en-US');
};
