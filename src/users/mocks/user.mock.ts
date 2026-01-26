import { User } from '../entities/user.entity';
import { UserRole } from '../entities/enums';

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  password: 'hashedPassword123',
  role: UserRole.NORMAL,
  emailVerificationCode: 'ABC123',
  emailVerificationCodeExpires: new Date('2024-01-02T00:00:00.000Z'),
  isEmailVerified: false,
  imageUrl: undefined,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

export const mockUser = createMockUser();

export const createMockVerifiedUser = (overrides?: Partial<User>): User =>
  createMockUser({
    isEmailVerified: true,
    emailVerificationCode: 'VERIFIED',
    ...overrides,
  });
