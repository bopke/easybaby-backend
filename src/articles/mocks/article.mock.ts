import { Article, ArticleTag } from '../entities';

const mockTag1: ArticleTag = {
  id: '1',
  tag: 'parenting',
  article: {} as Article,
  articleId: '123e4567-e89b-12d3-a456-426614174000',
};

const mockTag2: ArticleTag = {
  id: '2',
  tag: 'sign-language',
  article: {} as Article,
  articleId: '123e4567-e89b-12d3-a456-426614174000',
};

const mockTag3: ArticleTag = {
  id: '3',
  tag: 'baby-development',
  article: {} as Article,
  articleId: '123e4567-e89b-12d3-a456-426614174000',
};

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
  imageUrl: 'https://example.com/images/article.jpg',
  tags: [mockTag1, mockTag2, mockTag3],
  createdAt: new Date('2024-01-15T10:30:00.000Z'),
  updatedAt: new Date('2024-01-15T10:30:00.000Z'),
};
