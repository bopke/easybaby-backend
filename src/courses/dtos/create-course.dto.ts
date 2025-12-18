import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '../entities/enums';

export class CreateCourseDto {
  @ApiProperty({ example: 'first-aid-course-january-2025' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: '2025-01-15T10:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'First Aid Course - January 2025' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example:
      'Comprehensive first aid training course for parents and caregivers',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: CourseStatus, default: CourseStatus.DRAFT })
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus;

  @ApiPropertyOptional({ example: 20, minimum: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  availableSpots?: number;

  @ApiProperty({ example: 299.99, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'Data rozpoczęcia' })
  @IsString()
  @IsOptional()
  dateLabel?: string;
}
