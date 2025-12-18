import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '../entities/enums';
import { Course } from '../entities/course.entity';

export class CourseResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'first-aid-course-january-2025' })
  slug: string;

  @ApiProperty({ example: '2025-01-15T10:00:00.000Z' })
  date: string;

  @ApiProperty({ example: 'First Aid Course - January 2025' })
  title: string;

  @ApiProperty({
    example:
      'Comprehensive first aid training course for parents and caregivers',
  })
  description: string;

  @ApiProperty({ enum: CourseStatus, example: CourseStatus.OPEN })
  status: CourseStatus;

  @ApiPropertyOptional({ example: 20 })
  availableSpots?: number | null;

  @ApiProperty({ example: 299.99 })
  price: number;

  @ApiPropertyOptional({ example: 'Data rozpoczęcia' })
  dateLabel?: string | null;

  @ApiProperty({ example: '2024-12-18T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-12-18T10:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(course: Course): CourseResponseDto {
    const dto = new CourseResponseDto();
    dto.id = course.id;
    dto.slug = course.slug;
    dto.date = course.date.toISOString();
    dto.title = course.title;
    dto.description = course.description;
    dto.status = course.status;
    dto.availableSpots = course.availableSpots;
    dto.price = Number(course.price);
    dto.dateLabel = course.dateLabel;
    dto.createdAt = course.createdAt;
    dto.updatedAt = course.updatedAt;
    return dto;
  }
}
