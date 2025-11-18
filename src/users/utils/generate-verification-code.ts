/**
 * Generates a random 6-character alphanumeric verification code.
 * Uses uppercase letters (A-Z) and digits (0-9).
 *
 * @returns A 6-character alphanumeric string
 */
export function generateVerificationCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return code;
}
