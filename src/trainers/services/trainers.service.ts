import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from '../entities';
import {
  CreateTrainerDto,
  UpdateTrainerDto,
  FilterTrainerDto,
  OrderTrainerDto,
} from '../dtos';
import { Paginated, Pagination } from '../../common/pagination';
import { PaginationService } from '../../common/services/pagination.service';

@Injectable()
export class TrainersService {
  constructor(
    @InjectRepository(Trainer)
    private readonly trainersRepository: Repository<Trainer>,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(
    pagination: Pagination = { page: 1, limit: 10 },
    filters: FilterTrainerDto = {},
    ordering: OrderTrainerDto = {},
  ): Promise<Paginated<Trainer>> {
    const { page, limit } = pagination;

    const stringFields: (keyof Trainer)[] = [
      'name',
      'voivodeship',
      'city',
      'email',
      'site',
      'phone',
      'additionalOffer',
      'notes',
    ];

    const where = this.paginationService.buildWhereClause<Trainer>(
      filters as Record<string, unknown>,
      stringFields,
    );
    const order = this.paginationService.buildOrderClause<Trainer>(
      ordering.order,
      { createdAt: 'DESC' },
    );

    const [trainers, total] = await this.trainersRepository.findAndCount({
      where,
      order,
      skip: this.paginationService.calculateSkip(page, limit),
      take: limit,
    });

    return { data: trainers, total, page, limit };
  }

  async findOne(id: string): Promise<Trainer> {
    const trainer = await this.trainersRepository.findOne({ where: { id } });

    if (!trainer) {
      throw new NotFoundException(`Trainer with ID ${id} not found`);
    }

    return trainer;
  }

  async create(createTrainerDto: CreateTrainerDto): Promise<Trainer> {
    const trainer = this.trainersRepository.create(createTrainerDto);
    return this.trainersRepository.save(trainer);
  }

  async update(
    id: string,
    updateTrainerDto: UpdateTrainerDto,
  ): Promise<Trainer> {
    const trainer = await this.findOne(id);
    Object.assign(trainer, updateTrainerDto);
    return this.trainersRepository.save(trainer);
  }

  async remove(id: string): Promise<void> {
    const trainer = await this.findOne(id);
    await this.trainersRepository.remove(trainer);
  }
}
