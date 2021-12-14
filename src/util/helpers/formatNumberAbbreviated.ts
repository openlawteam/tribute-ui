/**
 * formatNumberAbbreviated
 *
 * Formats a `number` to abbreviated `string` for display.
 *
 * Has better browser support than using the newer options in `Intl.NumberFormat`.
 *
 * e.g. 1000000 likes->1M likes
 *
 * @param value `number`
 * @returns `string`
 *
 * @see https://stackoverflow.com/questions/25611937/abbreviate-a-localized-number-in-javascript-for-thousands-1k-and-millions-1m
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#scientific_engineering_or_compact_notations
 */
export function formatNumberAbbreviated(value: number): string {
  const intlFormat = (v: number): string =>
    new Intl.NumberFormat().format(Math.round(v * 10) / 10);

  // Trillions
  if (value >= 1000000000000) return intlFormat(value / 1000000000000) + 'T';
  // Billions
  if (value >= 1000000000) return intlFormat(value / 1000000000) + 'B';
  // Millions
  if (value >= 1000000) return intlFormat(value / 1000000) + 'M';
  // Thousands
  if (value >= 1000) return intlFormat(value / 1000) + 'k';

  // Fallthrough
  return intlFormat(value);
}
