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

export class SessionQueryDto {
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
    description: 'Filter by IP address (partial match)',
    example: '192.168',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Filter by user agent (partial match)',
    example: 'Mozilla',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'Filter by token family',
    example: 'family-123',
  })
  @IsOptional()
  @IsString()
  tokenFamily?: string;

  // Ordering
  @ApiPropertyOptional({
    description:
      'Order sessions by field(s) in format "field:direction". ' +
      'Valid fields: createdAt, lastUsedAt, expiresAt, ipAddress, userAgent. ' +
      'Valid directions: asc, desc. ' +
      'Multiple values can be provided for multi-level sorting.',
    example: ['lastUsedAt:desc', 'createdAt:desc'],
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
    /^(createdAt|lastUsedAt|expiresAt|ipAddress|userAgent|tokenFamily):(asc|desc)$/i,
    {
      each: true,
      message:
        'Each order must be in format "field:direction" where direction is asc or desc',
    },
  )
  order?: string[];
}
