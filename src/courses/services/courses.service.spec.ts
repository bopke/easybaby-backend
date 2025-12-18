import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course } from '../entities/course.entity';
import {
  CreateCourseDto,
  UpdateCourseDto,
  FilterCourseDto,
  OrderCourseDto,
} from '../dtos';
import { mockCourse, createMockCourse } from '../mocks/course.mock';
import { PaginationService } from '../../common/services/pagination.service';
import { CourseStatus } from '../entities/enums';

describe('CoursesService', () => {
  let service: CoursesService;
  let repository: Repository<Course>;
  let findOneSpy: jest.SpyInstance;
  let findAndCountSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;

  const mockDataSource = {
    getMetadata: jest.fn().mockReturnValue({
      columns: [
        { propertyName: 'id' },
        { propertyName: 'slug' },
        { propertyName: 'date' },
        { propertyName: 'title' },
        { propertyName: 'description' },
        { propertyName: 'status' },
        { propertyName: 'availableSpots' },
        { propertyName: 'price' },
        { propertyName: 'dateLabel' },
        { propertyName: 'createdAt' },
        { propertyName: 'updatedAt' },
      ],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        PaginationService,
        {
          provide: getRepositoryToken(Course),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    repository = module.get<Repository<Course>>(getRepositoryToken(Course));

    findOneSpy = jest.spyOn(repository, 'findOne');
    findAndCountSpy = jest.spyOn(repository, 'findAndCount');
    saveSpy = jest.spyOn(repository, 'save');
    removeSpy = jest.spyOn(repository, 'remove');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a paginated response of courses with default filters', async () => {
      const courses = [
        mockCourse,
        createMockCourse({ id: '2', title: 'Advanced First Aid' }),
      ];
      findAndCountSpy.mockResolvedValue([courses, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      const [callArgs] = findAndCountSpy.mock.calls[0] as [
        {
          where: Record<string, unknown>;
          order: Record<string, string>;
          skip: number;
          take: number;
        },
      ];
      expect(callArgs.where).toHaveProperty('status');
      expect(callArgs.where).toHaveProperty('date');
      expect(callArgs.order).toEqual({ date: 'ASC' });
      expect(callArgs.skip).toBe(0);
      expect(callArgs.take).toBe(10);
      expect(result).toEqual({
        data: courses,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('should apply explicit status filter correctly', async () => {
      const courses = [mockCourse];
      findAndCountSpy.mockResolvedValue([courses, 1]);

      const filters: FilterCourseDto = {
        status: CourseStatus.OPEN,
      };

      await service.findAll({ page: 1, limit: 10 }, filters);

      const [callArgs] = findAndCountSpy.mock.calls[0] as [
        { where: Record<string, unknown> },
      ];
      expect(callArgs.where).toMatchObject({ status: CourseStatus.OPEN });
      expect(callArgs.where).toHaveProperty('date');
    });

    it('should apply ordering correctly', async () => {
      const courses = [mockCourse];
      findAndCountSpy.mockResolvedValue([courses, 1]);

      const ordering: OrderCourseDto = {
        order: ['title:asc'],
      };

      await service.findAll({ page: 1, limit: 10 }, {}, ordering);

      expect(findAndCountSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { title: 'ASC' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a course by UUID', async () => {
      findOneSpy.mockResolvedValue(mockCourse);

      const result = await service.findOne(mockCourse.id);

      expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockCourse.id } });
      expect(result).toEqual(mockCourse);
    });

    it('should return a course by slug', async () => {
      findOneSpy.mockResolvedValue(mockCourse);

      const result = await service.findOne(mockCourse.slug);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { slug: mockCourse.slug },
      });
      expect(result).toEqual(mockCourse);
    });

    it('should throw NotFoundException if course not found by UUID', async () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      findOneSpy.mockResolvedValue(null);

      await expect(service.findOne(uuid)).rejects.toThrow(
        new NotFoundException(`Course with ID "${uuid}" not found`),
      );
    });

    it('should throw NotFoundException if course not found by slug', async () => {
      const slug = 'non-existent-slug';
      findOneSpy.mockResolvedValue(null);

      await expect(service.findOne(slug)).rejects.toThrow(
        new NotFoundException(`Course with slug "${slug}" not found`),
      );
    });
  });

  describe('create', () => {
    it('should create a new course', async () => {
      const createDto: CreateCourseDto = {
        slug: mockCourse.slug,
        date: mockCourse.date.toISOString(),
        title: mockCourse.title,
        description: mockCourse.description,
        status: mockCourse.status,
        availableSpots: mockCourse.availableSpots!,
        price: mockCourse.price,
        dateLabel: mockCourse.dateLabel!,
      };

      const createdCourse = { ...mockCourse };
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockReturnValue(createdCourse as Course);
      saveSpy.mockResolvedValue(createdCourse);

      const result = await service.create(createDto);

      expect(createSpy).toHaveBeenCalledWith({
        ...createDto,
        date: new Date(createDto.date),
      });
      expect(saveSpy).toHaveBeenCalledWith(createdCourse);
      expect(result).toEqual(createdCourse);
    });
  });

  describe('update', () => {
    it('should update a course', async () => {
      const updateDto: UpdateCourseDto = {
        title: 'Updated Title',
        price: 349.99,
      };

      findOneSpy.mockResolvedValue(mockCourse);
      saveSpy.mockResolvedValue({ ...mockCourse, ...updateDto });

      const result = await service.update(mockCourse.id, updateDto);

      expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockCourse.id } });
      expect(saveSpy).toHaveBeenCalled();
      expect(result.title).toEqual(updateDto.title);
      expect(result.price).toEqual(updateDto.price);
    });

    it('should update course date correctly', async () => {
      const updateDto: UpdateCourseDto = {
        date: '2025-02-15T10:00:00Z',
      };

      findOneSpy.mockResolvedValue(mockCourse);
      saveSpy.mockResolvedValue({
        ...mockCourse,
        date: new Date(updateDto.date),
      });

      const result = await service.update(mockCourse.id, updateDto);

      expect(saveSpy).toHaveBeenCalled();
      expect(result.date).toEqual(new Date(updateDto.date));
    });

    it('should throw NotFoundException if course not found', async () => {
      findOneSpy.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { title: 'New Title' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a course', async () => {
      findOneSpy.mockResolvedValue(mockCourse);
      removeSpy.mockResolvedValue(mockCourse);

      await service.remove(mockCourse.id);

      expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockCourse.id } });
      expect(removeSpy).toHaveBeenCalledWith(mockCourse);
    });

    it('should throw NotFoundException if course not found', async () => {
      findOneSpy.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
