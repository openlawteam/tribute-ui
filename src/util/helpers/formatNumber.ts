/**
 * formatNumber
 *
 * Formats a number (U.S. region) with commas (e.g. 1000 -> 1,000).
 *
 * @param {string | number} value
 * @returns {string}
 *
 * @todo maybe a more friendly way via Intl API in JS core?
 */
export const formatNumber = (value: number | string): string => {
  const regEx = new RegExp(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g);
  return typeof value === 'number'
    ? value.toString().replace(/,/g, '').replace(regEx, '$1,')
    : value.replace(/,/g, '').replace(regEx, '$1,');
};
