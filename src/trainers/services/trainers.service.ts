import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Like,
  FindOptionsWhere,
  LessThan,
  MoreThan,
  Between,
} from 'typeorm';
import { Trainer } from '../entities';
import { CreateTrainerDto, UpdateTrainerDto, FilterTrainerDto } from '../dtos';
import { Paginated, Pagination } from '../../common/pagination';

@Injectable()
export class TrainersService {
  constructor(
    @InjectRepository(Trainer)
    private readonly trainersRepository: Repository<Trainer>,
  ) {}

  // TODO: Parametrize ordering
  async findAll(
    pagination: Pagination = { page: 1, limit: 10 },
    filters: FilterTrainerDto = {},
  ): Promise<Paginated<Trainer>> {
    const { page, limit } = pagination;
    const where = this.buildWhereClause(filters);

    const [trainers, total] = await this.trainersRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
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
    if (filters.level) {
      where.level = Like(`%${filters.level}%`);
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

    // Date filters - before/after with "now" support
    const hasBeforeFilter = !!filters.expirationDateBefore;
    const hasAfterFilter = !!filters.expirationDateAfter;

    if (hasBeforeFilter && hasAfterFilter) {
      // Both filters provided - use Between for range query
      const afterDate =
        filters.expirationDateAfter!.toLowerCase() === 'now'
          ? new Date()
          : new Date(filters.expirationDateAfter!);
      const beforeDate =
        filters.expirationDateBefore!.toLowerCase() === 'now'
          ? new Date()
          : new Date(filters.expirationDateBefore!);
      where.expirationDate = Between(afterDate, beforeDate);
    } else if (hasBeforeFilter) {
      // Only before filter - use LessThan
      const date =
        filters.expirationDateBefore!.toLowerCase() === 'now'
          ? new Date()
          : new Date(filters.expirationDateBefore!);
      where.expirationDate = LessThan(date);
    } else if (hasAfterFilter) {
      // Only after filter - use MoreThan
      const date =
        filters.expirationDateAfter!.toLowerCase() === 'now'
          ? new Date()
          : new Date(filters.expirationDateAfter!);
      where.expirationDate = MoreThan(date);
    }

    return where;
  }

  async findOne(id: string): Promise<Trainer> {
    const trainer = await this.trainersRepository.findOne({ where: { id } });

    if (!trainer) {
      throw new NotFoundException(`Trainer with ID ${id} not found`);
    }

    return trainer;
  }

  async create(createTrainerDto: CreateTrainerDto): Promise<Trainer> {
    const { expirationDate, ...rest } = createTrainerDto;

    const trainer = this.trainersRepository.create({
      ...rest,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
    });

    return this.trainersRepository.save(trainer);
  }

  async update(
    id: string,
    updateTrainerDto: UpdateTrainerDto,
  ): Promise<Trainer> {
    const trainer = await this.findOne(id);

    const { expirationDate, ...rest } = updateTrainerDto;

    Object.assign(trainer, rest);

    if (expirationDate !== undefined) {
      trainer.expirationDate = new Date(expirationDate);
    }

    return this.trainersRepository.save(trainer);
  }

  async remove(id: string): Promise<void> {
    const trainer = await this.findOne(id);
    await this.trainersRepository.remove(trainer);
  }
}
