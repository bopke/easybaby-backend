import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from '../entities';
import { CreateTrainerDto, UpdateTrainerDto } from '../dtos';

@Injectable()
export class TrainersService {
  constructor(
    @InjectRepository(Trainer)
    private readonly trainersRepository: Repository<Trainer>,
  ) {}

  async findAll(): Promise<Trainer[]> {
    return this.trainersRepository.find();
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
