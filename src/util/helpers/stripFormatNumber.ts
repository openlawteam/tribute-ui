/**
 * stripFormatNumber
 *
 * Strips a number string formatting (via `formatNumber`) (e.g. 10,000 -> 10000).
 *
 * @param {string} value Number string to strip formatting (via `formatNumber`) from.
 * @returns {string} A Number string without any formatting form `formatNumber`.
 *
 * @todo maybe a more friendly way via Intl API in JS core?
 */
export const stripFormatNumber = (value: string): string =>
  value.toString().replace(/,/g, '');
