/**
 * numberRangeArray
 *
 * Outputs an array sequence of numbers given a total size and starting offset.
 * e.g. Years 1920..2002
 *
 * @param {size} number - Maximum number and last value of array. Default is 1.
 * @param {startAt} number - Offset to begin from. Default is 0.
 * @returns {number[]}
 */
export function numberRangeArray(size = 1, startAt = 0): number[] {
  const adjustedSize = size + 1 - startAt;

  return [...Array(adjustedSize)].map((_, i) => startAt + i);
}
