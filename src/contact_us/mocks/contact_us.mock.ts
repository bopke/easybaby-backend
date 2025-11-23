import { ContactUs } from '../entities';

export const createMockContactUs = (
  overrides?: Partial<ContactUs>,
): ContactUs => ({
  id: 'test-uuid',
  name: 'John Doe',
  email: 'john.doe@example.com',
  message: 'I would like to know more about your workshops.',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides,
});

export const mockContactUs = createMockContactUs();
