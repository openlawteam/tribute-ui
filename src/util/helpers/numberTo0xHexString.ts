/**
 * Takes a `number` and returns a hex string with a `0x` prefix.
 * If the number is negative, it is converted to positive.
 *
 * @param n `number`
 * @returns `0x${string}`
 */
export function numberTo0xHexString(
  n: number | undefined
): `0x${string}` | undefined {
  if (n === undefined || isNaN(n)) return;

  return `0x${Math.abs(n).toString(16)}`;
}
