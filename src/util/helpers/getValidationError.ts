/**
 * getValidationError
 *
 * Used with react-hook-form (mostly to solve a TS incorrect behavior)
 * Gets the associated error message with a field.
 *
 * @param {string} field
 * @param {Record<string, any>} errors
 * @returns string
 */
export function getValidationError(
  field: string,
  errors: Record<string, any>
): string {
  return errors[field] && 'message' in errors[field]
    ? (errors[field].message as string)
    : '';
}
