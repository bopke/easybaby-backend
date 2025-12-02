import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    description: 'URL-friendly slug for the article',
    example: 'getting-started-with-baby-sign-language',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'SEO meta title',
    example: 'Getting Started with Baby Sign Language - Complete Guide',
  })
  @IsString()
  @IsNotEmpty()
  metaTitle: string;

  @ApiProperty({
    description: 'SEO meta description',
    example:
      'Learn how to introduce sign language to your baby with our comprehensive guide.',
  })
  @IsString()
  @IsNotEmpty()
  metaDescription: string;

  @ApiProperty({
    description: 'Article header/title',
    example: 'Getting Started with Baby Sign Language',
  })
  @IsString()
  @IsNotEmpty()
  header: string;

  @ApiProperty({
    description: 'Article subheader',
    example: 'A comprehensive guide for parents',
  })
  @IsString()
  @IsNotEmpty()
  subheader: string;

  @ApiProperty({
    description: 'Article content (supports HTML/Markdown)',
    example: '<p>Baby sign language is a wonderful way to communicate...</p>',
  })
  @IsString()
  @IsNotEmpty()
  contents: string;

  @ApiProperty({
    description: 'Article author name',
    example: 'Dr. Jane Smith',
  })
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty({
    description: 'Publication date in ISO format',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  publishedDate: Date;

  @ApiProperty({
    description: 'Article tags',
    example: ['parenting', 'sign-language', 'baby-development'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
