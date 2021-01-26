/**
 * normalizeString
 *
 * Converts string case to lowerCase and trims whitespace.
 *
 * @param {string} stringToNormalize
 * @returns {string} The normalized string lowercased and trimmed.
 */
export function normalizeString(stringToNormalize: string): string {
  return stringToNormalize.toLowerCase().trim();
}
