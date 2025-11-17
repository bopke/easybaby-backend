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
} from '@nestjs/swagger';
import { Public } from '../../auth/guards';
import { Roles } from '../../auth/decorators';
import { UserRole } from '../../users/entities/enums';
import { TrainersService } from '../services';
import {
  CreateTrainerDto,
  UpdateTrainerDto,
  TrainerResponseDto,
  FilterTrainerDto,
} from '../dtos';
import { Paginated } from '../../common/pagination';

@ApiTags('Trainers')
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
  @Public()
  @ApiOperation({
    summary: 'Get all trainers with optional filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of trainers matching the filters',
    type: [TrainerResponseDto],
  })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query() filters: FilterTrainerDto,
  ): Promise<Paginated<TrainerResponseDto>> {
    const trainers = await this.trainersService.findAll(
      { page, limit },
      filters,
    );
    return {
      ...trainers,
      data: TrainerResponseDto.fromEntities(trainers.data),
    };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a trainer by ID' })
  @ApiParam({
    name: 'id',
    description: 'Trainer UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Trainer found',
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
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TrainerResponseDto> {
    const trainer = await this.trainersService.findOne(id);
    return TrainerResponseDto.fromEntity(trainer);
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
