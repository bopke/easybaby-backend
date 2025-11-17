import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, FindOptionsOrder } from 'typeorm';
import { Trainer } from '../entities';
import {
  CreateTrainerDto,
  UpdateTrainerDto,
  FilterTrainerDto,
  OrderTrainerDto,
} from '../dtos';
import { Paginated, Pagination } from '../../common/pagination';

@Injectable()
export class TrainersService {
  constructor(
    @InjectRepository(Trainer)
    private readonly trainersRepository: Repository<Trainer>,
  ) {}

  async findAll(
    pagination: Pagination = { page: 1, limit: 10 },
    filters: FilterTrainerDto = {},
    ordering: OrderTrainerDto = {},
  ): Promise<Paginated<Trainer>> {
    const { page, limit } = pagination;
    const where = this.buildWhereClause(filters);
    const order = this.buildOrderClause(ordering);

    const [trainers, total] = await this.trainersRepository.findAndCount({
      where,
      order,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: trainers, total: total, page, limit };
  }

  private buildWhereClause(
    filters: FilterTrainerDto,
  ): FindOptionsWhere<Trainer> {
    const where: FindOptionsWhere<Trainer> = {};

    // String filters - use Like for partial matching
    if (filters.name) {
      where.name = Like(`%${filters.name}%`);
    }
    if (filters.voivodeship) {
      where.voivodeship = Like(`%${filters.voivodeship}%`);
    }
    if (filters.city) {
      where.city = Like(`%${filters.city}%`);
    }
    if (filters.email) {
      where.email = Like(`%${filters.email}%`);
    }
    if (filters.site) {
      where.site = Like(`%${filters.site}%`);
    }
    if (filters.phone) {
      where.phone = Like(`%${filters.phone}%`);
    }
    if (filters.additionalOffer) {
      where.additionalOffer = Like(`%${filters.additionalOffer}%`);
    }
    if (filters.notes) {
      where.notes = Like(`%${filters.notes}%`);
    }
    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    return where;
  }

  private buildOrderClause(
    ordering: OrderTrainerDto,
  ): FindOptionsOrder<Trainer> {
    const order: FindOptionsOrder<Trainer> = {};

    if (ordering.order && ordering.order.length > 0) {
      for (const orderStr of ordering.order) {
        const [field, direction] = orderStr.split(':');
        order[field as keyof Trainer] = direction.toUpperCase() as
          | 'ASC'
          | 'DESC';
      }
    } else {
      // Default order by createdAt descending
      order.createdAt = 'DESC';
    }

    return order;
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
