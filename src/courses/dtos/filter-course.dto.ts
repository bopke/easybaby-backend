import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '../entities/enums';

export class FilterCourseDto {
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
}
