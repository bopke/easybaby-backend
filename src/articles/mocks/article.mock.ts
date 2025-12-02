import { Article } from '../entities';

export const mockArticle: Article = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  slug: 'getting-started-with-baby-sign-language',
  metaTitle: 'Getting Started with Baby Sign Language - Complete Guide',
  metaDescription:
    'Learn how to introduce sign language to your baby with our comprehensive guide.',
  header: 'Getting Started with Baby Sign Language',
  subheader: 'A comprehensive guide for parents',
  contents:
    '<p>Baby sign language is a wonderful way to communicate with your infant before they can speak...</p>',
  author: 'Dr. Jane Smith',
  publishedDate: new Date('2024-01-15T00:00:00.000Z'),
  createdAt: new Date('2024-01-15T10:30:00.000Z'),
  updatedAt: new Date('2024-01-15T10:30:00.000Z'),
};
