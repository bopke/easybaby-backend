import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from '../services/courses.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseResponseDto,
  CourseQueryDto,
} from '../dtos';
import { mockCourse, createMockCourse } from '../mocks/course.mock';
import { CourseStatus } from '../entities/enums';

describe('CoursesController', () => {
  let controller: CoursesController;
  let coursesService: CoursesService;

  const mockCourseResponse: CourseResponseDto =
    CourseResponseDto.fromEntity(mockCourse);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        {
          provide: CoursesService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
    coursesService = module.get<CoursesService>(CoursesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new course and return response DTO', async () => {
      const createCourseDto: CreateCourseDto = {
        slug: 'first-aid-course-january-2025',
        date: '2025-01-15T10:00:00Z',
        title: 'First Aid Course - January 2025',
        description:
          'Comprehensive first aid training course for parents and caregivers',
        status: CourseStatus.OPEN,
        availableSpots: 20,
        price: 299.99,
        dateLabel: 'Data rozpoczęcia',
      };

      const createSpy = jest
        .spyOn(coursesService, 'create')
        .mockResolvedValue(mockCourse);

      const result = await controller.create(createCourseDto);

      expect(result).toEqual(mockCourseResponse);
      expect(createSpy).toHaveBeenCalledWith(createCourseDto);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return a paginated response of course DTOs', async () => {
      const courses = [
        mockCourse,
        createMockCourse({ id: '2', title: 'Advanced First Aid' }),
      ];

      const paginatedResponse = {
        data: courses,
        total: 2,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(coursesService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const query: CourseQueryDto = { page: 1, limit: 10 };
      const result = await controller.findAll(query);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual(CourseResponseDto.fromEntity(courses[0]));
      expect(result.data[1]).toEqual(CourseResponseDto.fromEntity(courses[1]));
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(findAllSpy).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        {},
        { order: undefined },
      );
      expect(findAllSpy).toHaveBeenCalledTimes(1);
    });

    it('should pass filters and ordering to service', async () => {
      const courses = [mockCourse];
      const paginatedResponse = {
        data: courses,
        total: 1,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(coursesService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const query: CourseQueryDto = {
        page: 1,
        limit: 10,
        status: CourseStatus.OPEN,
        order: ['date:asc'],
      };

      await controller.findAll(query);

      expect(findAllSpy).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        { status: CourseStatus.OPEN },
        { order: ['date:asc'] },
      );
    });
  });

  describe('findOne', () => {
    it('should return a course DTO by UUID', async () => {
      const findOneSpy = jest
        .spyOn(coursesService, 'findOne')
        .mockResolvedValue(mockCourse);

      const result = await controller.findOne(mockCourse.id);

      expect(result).toEqual(mockCourseResponse);
      expect(findOneSpy).toHaveBeenCalledWith(mockCourse.id);
      expect(findOneSpy).toHaveBeenCalledTimes(1);
    });

    it('should return a course DTO by slug', async () => {
      const findOneSpy = jest
        .spyOn(coursesService, 'findOne')
        .mockResolvedValue(mockCourse);

      const result = await controller.findOne(mockCourse.slug);

      expect(result).toEqual(mockCourseResponse);
      expect(findOneSpy).toHaveBeenCalledWith(mockCourse.slug);
      expect(findOneSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if course not found by UUID', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const findOneSpy = jest
        .spyOn(coursesService, 'findOne')
        .mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(uuid)).rejects.toThrow(NotFoundException);
      expect(findOneSpy).toHaveBeenCalledWith(uuid);
    });

    it('should throw NotFoundException if course not found by slug', async () => {
      const slug = 'non-existent-slug';
      const findOneSpy = jest
        .spyOn(coursesService, 'findOne')
        .mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(slug)).rejects.toThrow(NotFoundException);
      expect(findOneSpy).toHaveBeenCalledWith(slug);
    });
  });

  describe('update', () => {
    it('should update a course and return response DTO', async () => {
      const updateCourseDto: UpdateCourseDto = {
        title: 'Updated Title',
        price: 349.99,
      };

      const updatedCourse = {
        ...mockCourse,
        ...updateCourseDto,
      };

      const updateSpy = jest
        .spyOn(coursesService, 'update')
        .mockResolvedValue(updatedCourse);

      const result = await controller.update(mockCourse.id, updateCourseDto);

      expect(result).toEqual(CourseResponseDto.fromEntity(updatedCourse));
      expect(updateSpy).toHaveBeenCalledWith(mockCourse.id, updateCourseDto);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if course not found', async () => {
      const updateSpy = jest
        .spyOn(coursesService, 'update')
        .mockRejectedValue(new NotFoundException());

      await expect(
        controller.update('non-existent-id', { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
      expect(updateSpy).toHaveBeenCalledWith('non-existent-id', {
        title: 'New Title',
      });
    });
  });

  describe('remove', () => {
    it('should remove a course', async () => {
      const removeSpy = jest
        .spyOn(coursesService, 'remove')
        .mockResolvedValue(undefined);

      await controller.remove(mockCourse.id);

      expect(removeSpy).toHaveBeenCalledWith(mockCourse.id);
      expect(removeSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if course not found', async () => {
      const removeSpy = jest
        .spyOn(coursesService, 'remove')
        .mockRejectedValue(new NotFoundException());

      await expect(controller.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(removeSpy).toHaveBeenCalledWith('non-existent-id');
    });
  });
});
