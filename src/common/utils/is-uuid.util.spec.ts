import { isUuid } from './is-uuid.util';

describe('isUuid', () => {
  describe('valid UUIDs', () => {
    it('should return true for valid UUID v4', () => {
      expect(isUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('should return true for UUID with lowercase letters', () => {
      expect(isUuid('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
    });

    it('should return true for UUID with uppercase letters', () => {
      expect(isUuid('A1B2C3D4-E5F6-7890-ABCD-EF1234567890')).toBe(true);
    });

    it('should return true for UUID with mixed case letters', () => {
      expect(isUuid('A1b2C3d4-E5f6-7890-AbCd-Ef1234567890')).toBe(true);
    });

    it('should return true for UUID with all zeros', () => {
      expect(isUuid('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    it('should return true for UUID with all fs', () => {
      expect(isUuid('ffffffff-ffff-ffff-ffff-ffffffffffff')).toBe(true);
    });
  });

  describe('invalid UUIDs', () => {
    it('should return false for empty string', () => {
      expect(isUuid('')).toBe(false);
    });

    it('should return false for string without dashes', () => {
      expect(isUuid('123e4567e89b12d3a456426614174000')).toBe(false);
    });

    it('should return false for string with wrong number of segments', () => {
      expect(isUuid('123e4567-e89b-12d3-426614174000')).toBe(false);
    });

    it('should return false for string with wrong segment lengths', () => {
      expect(isUuid('123e456-e89b-12d3-a456-426614174000')).toBe(false);
    });

    it('should return false for string with invalid characters', () => {
      expect(isUuid('123e4567-e89b-12d3-a456-42661417400g')).toBe(false);
    });

    it('should return false for string with spaces', () => {
      expect(isUuid('123e4567-e89b-12d3-a456-426614174000 ')).toBe(false);
    });

    it('should return false for slug-like string', () => {
      expect(isUuid('first-aid-course-january-2025')).toBe(false);
    });

    it('should return false for slug with uuid-like pattern', () => {
      expect(isUuid('article-123e4567-e89b-12d3')).toBe(false);
    });

    it('should return false for plain text', () => {
      expect(isUuid('not-a-uuid')).toBe(false);
    });

    it('should return false for number string', () => {
      expect(isUuid('12345')).toBe(false);
    });
  });
});
