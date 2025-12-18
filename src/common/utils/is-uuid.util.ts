/**
 * Regular expression pattern for validating UUIDs (RFC 4122)
 * Matches UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * where x is a hexadecimal digit (0-9, a-f, case-insensitive)
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks if a given string is a valid UUID (RFC 4122)
 *
 * @param value - The string to validate
 * @returns true if the string is a valid UUID, false otherwise
 *
 * @example
 * isUuid('123e4567-e89b-12d3-a456-426614174000') // true
 * isUuid('not-a-uuid') // false
 * isUuid('') // false
 */
export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}
