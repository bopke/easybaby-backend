import {
  IsOptional,
  IsString,
  IsArray,
  Matches,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { CourseStatus } from '../entities/enums';

export class CourseQueryDto {
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
    description: 'Filter by course title (partial match)',
    example: 'First Aid',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Filter by course slug (partial match)',
    example: 'first-aid',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Filter by course status',
    enum: CourseStatus,
    example: CourseStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({
    description: 'Filter by description (partial match)',
    example: 'training',
  })
  @IsOptional()
  @IsString()
  description?: string;

  // Ordering
  @ApiPropertyOptional({
    description:
      'Order courses by field(s) in format "field:direction". ' +
      'Valid fields: title, slug, date, status, price, availableSpots, createdAt, updatedAt. ' +
      'Valid directions: asc, desc. ' +
      'Multiple values can be provided for multi-level sorting.',
    example: ['date:asc', 'createdAt:desc'],
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
    /^(title|slug|date|status|price|availableSpots|createdAt|updatedAt):(asc|desc)$/i,
    {
      each: true,
      message:
        'Each order must be in format "field:direction" where direction is asc or desc',
    },
  )
  order?: string[];
}
