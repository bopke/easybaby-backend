import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Course } from '../entities/course.entity';
import { CourseStatus } from '../entities/enums';
import {
  CreateCourseDto,
  UpdateCourseDto,
  FilterCourseDto,
  OrderCourseDto,
} from '../dtos';
import { Paginated, Pagination } from '../../common/pagination';
import { PaginationService } from '../../common/services/pagination.service';
import { isUuid } from '../../common/utils';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(
    pagination: Pagination = { page: 1, limit: 10 },
    filters: FilterCourseDto = {},
    ordering: OrderCourseDto = {},
  ): Promise<Paginated<Course>> {
    const { page, limit } = pagination;

    const stringFields: (keyof Course)[] = ['title', 'slug', 'description'];

    // Build where clause from filters
    const where = this.paginationService.buildWhereClause<Course>(
      filters as Record<string, unknown>,
      stringFields,
    );

    // Apply default filters:
    // 1. Only show courses with status: FULL, CANCELLED, or OPEN (exclude DRAFT)
    // 2. Only show courses with date in the future
    if (!filters.status) {
      where.status = In([
        CourseStatus.FULL,
        CourseStatus.CANCELLED,
        CourseStatus.OPEN,
      ]) as never;
    }

    // Always filter by future dates (date > now)
    where.date = MoreThan(new Date()) as never;

    const order = this.paginationService.buildOrderClause<Course>(
      ordering.order,
      { date: 'ASC' }, // Default to showing soonest courses first
      Course,
    );

    const [courses, total] = await this.coursesRepository.findAndCount({
      where,
      order,
      skip: this.paginationService.calculateSkip(page, limit),
      take: limit,
    });

    return { data: courses, total, page, limit };
  }

  async findOne(idOrSlug: string): Promise<Course> {
    const isUuidValue = isUuid(idOrSlug);

    const course = await this.coursesRepository.findOne({
      where: isUuidValue ? { id: idOrSlug } : { slug: idOrSlug },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with ${isUuidValue ? 'ID' : 'slug'} "${idOrSlug}" not found`,
      );
    }

    return course;
  }

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const course = this.coursesRepository.create({
      ...createCourseDto,
      date: new Date(createCourseDto.date),
    });
    return this.coursesRepository.save(course);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);

    const updateData = { ...updateCourseDto };
    if (updateCourseDto.date) {
      updateData.date = new Date(updateCourseDto.date) as never;
    }

    Object.assign(course, updateData);
    return this.coursesRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findOne(id);
    await this.coursesRepository.remove(course);
  }
}
