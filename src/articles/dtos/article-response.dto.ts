import { ApiProperty } from '@nestjs/swagger';
import { Expose, instanceToPlain } from 'class-transformer';
import { Article } from '../entities';

export class ArticleResponseDto {
  @ApiProperty({
    description: 'Article ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  id: string;

  @ApiProperty({
    description: 'URL-friendly slug for the article',
    example: 'getting-started-with-baby-sign-language',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  slug: string;

  @ApiProperty({
    description: 'SEO meta title',
    example: 'Getting Started with Baby Sign Language - Complete Guide',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  metaTitle: string;

  @ApiProperty({
    description: 'SEO meta description',
    example:
      'Learn how to introduce sign language to your baby with our comprehensive guide.',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  metaDescription: string;

  @ApiProperty({
    description: 'Article header/title',
    example: 'Getting Started with Baby Sign Language',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  header: string;

  @ApiProperty({
    description: 'Article subheader',
    example: 'A comprehensive guide for parents',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  subheader: string;

  @ApiProperty({
    description: 'Article content',
    example: '<p>Baby sign language is a wonderful way to communicate...</p>',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  contents: string;

  @ApiProperty({
    description: 'Article author name',
    example: 'Dr. Jane Smith',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  author: string;

  @ApiProperty({
    description: 'Publication date',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  publishedDate: Date;

  @ApiProperty({
    description: 'Article tags',
    example: ['parenting', 'sign-language', 'baby-development'],
    type: [String],
  })
  @Expose({ groups: ['public', 'user', 'admin'] })
  tags: string[];

  @ApiProperty({
    description: 'Creation timestamp (admin only)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose({ groups: ['admin'] })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp (admin only)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose({ groups: ['admin'] })
  updatedAt: Date;

  constructor(article: Article) {
    this.id = article.id;
    this.slug = article.slug;
    this.metaTitle = article.metaTitle;
    this.metaDescription = article.metaDescription;
    this.header = article.header;
    this.subheader = article.subheader;
    this.contents = article.contents;
    this.author = article.author;
    this.publishedDate = article.publishedDate;
    this.tags = article.tags ? article.tags.map((t) => t.tag) : [];
    this.createdAt = article.createdAt;
    this.updatedAt = article.updatedAt;
  }

  static fromEntity(article: Article): ArticleResponseDto;
  static fromEntity(article: Article, groups: string[]): Record<string, any>;
  static fromEntity(
    article: Article,
    groups?: string[],
  ): ArticleResponseDto | Record<string, any> {
    const dto = new ArticleResponseDto(article);
    if (groups) {
      return instanceToPlain(dto, { groups });
    }
    return dto;
  }

  static fromEntities(articles: Article[]): ArticleResponseDto[];
  static fromEntities(
    articles: Article[],
    groups: string[],
  ): Array<Record<string, any>>;
  static fromEntities(
    articles: Article[],
    groups?: string[],
  ): ArticleResponseDto[] | Array<Record<string, any>> {
    const dtos = articles.map((article) => new ArticleResponseDto(article));
    if (groups) {
      return dtos.map((dto) => instanceToPlain(dto, { groups }));
    }
    return dtos;
  }
}
