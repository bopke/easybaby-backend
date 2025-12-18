import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators';
import { Public } from '../../auth/guards';
import { UserRole } from '../../users/entities/enums';
import { CoursesService } from '../services/courses.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseResponseDto,
  CourseQueryDto,
} from '../dtos';
import { Paginated } from '../../common/pagination';

@ApiTags('Courses')
@ApiExtraModels(CourseResponseDto)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async create(
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<CourseResponseDto> {
    const course = await this.coursesService.create(createCourseDto);
    return CourseResponseDto.fromEntity(course);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary:
      'Get all courses with optional filtering, ordering, and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of courses matching the filters and ordering',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(CourseResponseDto) },
        },
        total: {
          type: 'number',
          description: 'Total number of courses matching the filters',
          example: 100,
        },
        page: {
          type: 'number',
          description: 'Current page number',
          example: 1,
        },
        limit: {
          type: 'number',
          description: 'Number of items per page',
          example: 10,
        },
      },
    },
  })
  async findAll(
    @Query() query: CourseQueryDto,
  ): Promise<Paginated<CourseResponseDto>> {
    const { page = 1, limit = 10, order, ...filters } = query;

    const courses = await this.coursesService.findAll(
      { page, limit },
      filters,
      { order },
    );

    return {
      ...courses,
      data: courses.data.map((course) => CourseResponseDto.fromEntity(course)),
    };
  }

  @Get(':idOrSlug')
  @Public()
  @ApiOperation({
    summary:
      'Get a course by ID or slug. ' +
      'Automatically detects if the parameter is a UUID (ID) or a string (slug).',
  })
  @ApiParam({
    name: 'idOrSlug',
    description: 'Course UUID or slug',
    examples: {
      uuid: {
        value: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Search by UUID',
      },
      slug: {
        value: 'first-aid-course-january-2025',
        description: 'Search by slug',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Course found',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
  ): Promise<CourseResponseDto> {
    const course = await this.coursesService.findOne(idOrSlug);
    return CourseResponseDto.fromEntity(course);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a course (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Course UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or UUID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    const course = await this.coursesService.update(id, updateCourseDto);
    return CourseResponseDto.fromEntity(course);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Course UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Course deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Valid JWT token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.coursesService.remove(id);
  }
}
