import { RefreshToken } from '../entities/refresh-token.entity';
import { mockUser } from '../../users/mocks';

export const createMockRefreshToken = (
  overrides?: Partial<RefreshToken>,
): RefreshToken => ({
  id: 'token-id',
  jti: 'jti-123',
  userId: mockUser.id,
  user: mockUser,
  expiresAt: new Date(Date.now() + 86400000), // 1 day from now
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  lastUsedAt: null,
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
  isRevoked: false,
  tokenFamily: 'family-123',
  ...overrides,
});

export const mockRefreshToken = createMockRefreshToken();
