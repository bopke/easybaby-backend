import { Course } from '../entities/course.entity';
import { CourseStatus } from '../entities/enums';

export const createMockCourse = (overrides?: Partial<Course>): Course => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  slug: 'first-aid-course-january-2025',
  date: new Date('2025-01-15T10:00:00.000Z'),
  title: 'First Aid Course - January 2025',
  description:
    'Comprehensive first aid training course for parents and caregivers',
  status: CourseStatus.OPEN,
  availableSpots: 20,
  price: 299.99,
  dateLabel: 'Data rozpoczęcia',
  createdAt: new Date('2024-12-18T10:00:00.000Z'),
  updatedAt: new Date('2024-12-18T10:00:00.000Z'),
  ...overrides,
});

export const mockCourse = createMockCourse();

export const createMockDraftCourse = (overrides?: Partial<Course>): Course => ({
  ...createMockCourse(),
  id: '223e4567-e89b-12d3-a456-426614174001',
  slug: 'draft-course',
  status: CourseStatus.DRAFT,
  ...overrides,
});

export const createMockOpenCourse = (overrides?: Partial<Course>): Course => ({
  ...createMockCourse(),
  id: '223e4567-e89b-12d3-a456-426614174001',
  slug: 'open-course',
  status: CourseStatus.OPEN,
  ...overrides,
});

export const createMockFullCourse = (overrides?: Partial<Course>): Course => ({
  ...createMockCourse(),
  id: '323e4567-e89b-12d3-a456-426614174002',
  slug: 'full-course',
  status: CourseStatus.FULL,
  availableSpots: 0,
  ...overrides,
});

export const createMockCancelledCourse = (
  overrides?: Partial<Course>,
): Course => ({
  ...createMockCourse(),
  id: '423e4567-e89b-12d3-a456-426614174003',
  slug: 'cancelled-course',
  status: CourseStatus.CANCELLED,
  availableSpots: null,
  ...overrides,
});
