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
  Request,
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
import { Roles, OptionalAuth } from '../../auth/decorators';
import { UserRole } from '../../users/entities/enums';
import { TrainersService } from '../services';
import {
  CreateTrainerDto,
  UpdateTrainerDto,
  TrainerResponseDto,
  TrainerQueryDto,
} from '../dtos';
import { Paginated } from '../../common/pagination';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

interface RequestWithUser {
  user?: JwtPayload;
}

@ApiTags('Trainers')
@ApiExtraModels(TrainerResponseDto)
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new trainer (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Trainer created successfully',
    type: TrainerResponseDto,
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
    @Body() createTrainerDto: CreateTrainerDto,
  ): Promise<TrainerResponseDto> {
    const trainer = await this.trainersService.create(createTrainerDto);
    return TrainerResponseDto.fromEntity(trainer);
  }

  @Get()
  @OptionalAuth()
  @ApiOperation({
    summary:
      'Get all trainers with optional filtering, ordering, and pagination. ' +
      'Returns different fields based on authentication: ' +
      'public (unauthenticated) sees basic info, ' +
      'authenticated users see contact details, ' +
      'admins see all fields.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Paginated list of trainers matching the filters and ordering. ' +
      'Fields returned depend on user role.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(TrainerResponseDto) },
        },
        total: {
          type: 'number',
          description: 'Total number of trainers matching the filters',
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
  @ApiBearerAuth()
  async findAll(
    @Query() query: TrainerQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<Paginated<any>> {
    const { page = 1, limit = 10, order, ...filters } = query;

    const trainers = await this.trainersService.findAll(
      { page, limit },
      filters,
      { order },
    );

    // Determine serialization group based on user role
    const group = this.getSerializationGroup(req.user);

    return {
      ...trainers,
      data: TrainerResponseDto.fromEntities(trainers.data, [group]),
    };
  }

  private getSerializationGroup(user?: JwtPayload): string {
    if (!user) {
      return 'public';
    }
    if (user.role === UserRole.ADMIN) {
      return 'admin';
    }
    return 'user';
  }

  @Get(':id')
  @OptionalAuth()
  @ApiOperation({
    summary:
      'Get a trainer by ID. Returns different fields based on authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Trainer UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Trainer found. Fields returned depend on user role.',
    type: TrainerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID format',
  })
  @ApiResponse({
    status: 404,
    description: 'Trainer not found',
  })
  @ApiBearerAuth()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ): Promise<any> {
    const trainer = await this.trainersService.findOne(id);
    const group = this.getSerializationGroup(req.user);
    return TrainerResponseDto.fromEntity(trainer, [group]);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a trainer (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Trainer UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Trainer updated successfully',
    type: TrainerResponseDto,
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
    description: 'Trainer not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTrainerDto: UpdateTrainerDto,
  ): Promise<TrainerResponseDto> {
    const trainer = await this.trainersService.update(id, updateTrainerDto);
    return TrainerResponseDto.fromEntity(trainer);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a trainer (Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'Trainer UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Trainer deleted successfully',
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
    description: 'Trainer not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.trainersService.remove(id);
  }
}
