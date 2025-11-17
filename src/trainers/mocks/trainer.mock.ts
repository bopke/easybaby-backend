import { Trainer } from '../entities';

export const mockTrainer: Trainer = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Jan Kowalski',
  voivodeship: 'Mazowieckie',
  city: 'Warszawa',
  email: 'jan.kowalski@example.com',
  site: 'https://example.com',
  phone: '+48 123 456 789',
  additionalOffer: 'Individual training sessions',
  isVerified: false,
  notes: 'Available on weekends',
  createdAt: new Date('2024-01-15T10:30:00.000Z'),
  updatedAt: new Date('2024-01-15T10:30:00.000Z'),
};
