import {
  IsOptional,
  IsString,
  IsArray,
  Matches,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class ArticleQueryDto {
  // Pagination
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  // Filtering
  @ApiPropertyOptional({
    description: 'Filter by slug (partial match)',
    example: 'baby-sign',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Filter by meta title (partial match)',
    example: 'Getting Started',
  })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'Filter by meta description (partial match)',
    example: 'guide',
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({
    description: 'Filter by header (partial match)',
    example: 'Baby Sign Language',
  })
  @IsOptional()
  @IsString()
  header?: string;

  @ApiPropertyOptional({
    description: 'Filter by subheader (partial match)',
    example: 'guide for parents',
  })
  @IsOptional()
  @IsString()
  subheader?: string;

  @ApiPropertyOptional({
    description: 'Filter by contents (partial match)',
    example: 'communicate',
  })
  @IsOptional()
  @IsString()
  contents?: string;

  @ApiPropertyOptional({
    description: 'Filter by author (partial match)',
    example: 'Dr. Smith',
  })
  @IsOptional()
  @IsString()
  author?: string;

  // Ordering
  @ApiPropertyOptional({
    description:
      'Order articles by field(s) in format "field:direction". ' +
      'Valid fields: slug, metaTitle, metaDescription, header, subheader, ' +
      'contents, author, publishedDate, createdAt, updatedAt. ' +
      'Valid directions: asc, desc. ' +
      'Multiple values can be provided for multi-level sorting.',
    example: ['publishedDate:desc', 'header:asc'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }: { value: string | string[] }) => {
    // Handle single string or array of strings
    if (typeof value === 'string') {
      return [value];
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  @Matches(
    /^(slug|metaTitle|metaDescription|header|subheader|contents|author|publishedDate|createdAt|updatedAt):(asc|desc)$/i,
    {
      each: true,
      message:
        'Each order must be in format "field:direction" where direction is asc or desc',
    },
  )
  order?: string[];
}
