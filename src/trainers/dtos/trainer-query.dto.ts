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

export class TrainerQueryDto {
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
    description: 'Filter by trainer name (partial match)',
    example: 'Jan',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by voivodeship (partial match)',
    example: 'Mazowieckie',
  })
  @IsOptional()
  @IsString()
  voivodeship?: string;

  @ApiPropertyOptional({
    description: 'Filter by city (partial match)',
    example: 'Warszawa',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by email (partial match)',
    example: 'jan@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Filter by website (partial match)',
    example: 'example.com',
  })
  @IsOptional()
  @IsString()
  site?: string;

  @ApiPropertyOptional({
    description: 'Filter by phone number (partial match)',
    example: '+48 123',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Filter by additional offer (partial match)',
    example: 'Individual',
  })
  @IsOptional()
  @IsString()
  additionalOffer?: string;

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | boolean }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'boolean') return value;
    return undefined;
  })
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by notes (partial match)',
    example: 'Available',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  // Ordering
  @ApiPropertyOptional({
    description:
      'Order trainers by field(s) in format "field:direction". ' +
      'Valid fields: name, voivodeship, city, email, site, phone, ' +
      'additionalOffer, isVerified, notes, createdAt, updatedAt. ' +
      'Valid directions: asc, desc. ' +
      'Multiple values can be provided for multi-level sorting.',
    example: ['name:asc', 'createdAt:desc'],
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
    /^(name|voivodeship|city|email|site|phone|additionalOffer|isVerified|notes|createdAt|updatedAt):(asc|desc)$/i,
    {
      each: true,
      message:
        'Each order must be in format "field:direction" where direction is asc or desc',
    },
  )
  order?: string[];
}
