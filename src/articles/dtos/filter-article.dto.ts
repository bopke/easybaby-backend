import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterArticleDto {
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
}
