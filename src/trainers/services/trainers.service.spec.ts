import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like, LessThan, MoreThan, Between } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { Trainer } from '../entities';
import {
  CreateTrainerDto,
  UpdateTrainerDto,
  FilterTrainerDto,
  OrderTrainerDto,
} from '../dtos';
import { mockTrainer } from '../mocks';

describe('TrainersService', () => {
  let service: TrainersService;
  let repository: Repository<Trainer>;
  let findOneSpy: jest.SpyInstance;
  let findAndCountSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainersService,
        {
          provide: getRepositoryToken(Trainer),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TrainersService>(TrainersService);
    repository = module.get<Repository<Trainer>>(getRepositoryToken(Trainer));

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
    it('should return a paginated response of trainers', async () => {
      const trainers = [
        mockTrainer,
        { ...mockTrainer, id: '2', name: 'Anna Nowak' },
      ];
      findAndCountSpy.mockResolvedValue([trainers, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: trainers,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('should return an empty paginated response if no trainers exist', async () => {
      findAndCountSpy.mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });
    });

    it('should handle custom pagination parameters', async () => {
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 50]);

      const result = await service.findAll({ page: 3, limit: 20 });

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
        skip: 40,
        take: 20,
      });
      expect(result).toEqual({
        data: trainers,
        total: 50,
        page: 3,
        limit: 20,
      });
    });

    it('should filter trainers by name', async () => {
      const filters: FilterTrainerDto = { name: 'Jan' };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const result = await service.findAll({ page: 1, limit: 10 }, filters);

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: { name: Like('%Jan%') },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(trainers);
    });

    it('should filter trainers by city', async () => {
      const filters: FilterTrainerDto = { city: 'Warszawa' };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const result = await service.findAll({ page: 1, limit: 10 }, filters);

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: { city: Like('%Warszawa%') },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(trainers);
    });

    it('should filter trainers by multiple fields', async () => {
      const filters: FilterTrainerDto = {
        name: 'Jan',
        voivodeship: 'Mazowieckie',
        level: 'Certyfikat',
      };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const result = await service.findAll({ page: 1, limit: 10 }, filters);

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: {
          name: Like('%Jan%'),
          voivodeship: Like('%Mazowieckie%'),
          level: Like('%Certyfikat%'),
        },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(trainers);
    });

    it('should filter trainers by expiration date before a given date', async () => {
      const filters: FilterTrainerDto = { expirationDateBefore: '2025-12-31' };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const result = await service.findAll({ page: 1, limit: 10 }, filters);

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: { expirationDate: LessThan(new Date('2025-12-31')) },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(trainers);
    });

    it('should filter trainers by expiration date after a given date', async () => {
      const filters: FilterTrainerDto = { expirationDateAfter: '2025-01-01' };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const result = await service.findAll({ page: 1, limit: 10 }, filters);

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: { expirationDate: MoreThan(new Date('2025-01-01')) },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(trainers);
    });

    it('should filter trainers by expiration date using "now" as before date', async () => {
      const filters: FilterTrainerDto = { expirationDateBefore: 'now' };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const beforeCall = new Date();
      await service.findAll({ page: 1, limit: 10 }, filters);
      const afterCall = new Date();

      expect(findAndCountSpy).toHaveBeenCalled();
      const callArgs = findAndCountSpy.mock.calls[0] as unknown as Array<{
        where: { expirationDate: { value: Date } };
      }>;
      const passedDate = callArgs[0].where.expirationDate.value;

      // Check that the date used is between before and after the call
      expect(passedDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(passedDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should filter trainers by expiration date using "now" as after date', async () => {
      const filters: FilterTrainerDto = { expirationDateAfter: 'NOW' };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const beforeCall = new Date();
      await service.findAll({ page: 1, limit: 10 }, filters);
      const afterCall = new Date();

      expect(findAndCountSpy).toHaveBeenCalled();
      const callArgs = findAndCountSpy.mock.calls[0] as unknown as Array<{
        where: { expirationDate: { value: Date } };
      }>;
      const passedDate = callArgs[0].where.expirationDate.value;

      // Check that the date used is between before and after the call
      expect(passedDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(passedDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should filter trainers with date range using both before and after', async () => {
      const filters: FilterTrainerDto = {
        expirationDateAfter: '2025-01-01',
        expirationDateBefore: '2025-12-31',
      };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const result = await service.findAll({ page: 1, limit: 10 }, filters);

      // When both filters are provided, Between is used for proper range query
      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: {
          expirationDate: Between(
            new Date('2025-01-01'),
            new Date('2025-12-31'),
          ),
        },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(trainers);
    });

    it('should filter trainers with date range using "now" in both filters', async () => {
      const filters: FilterTrainerDto = {
        expirationDateAfter: 'now',
        expirationDateBefore: '2025-12-31',
      };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const beforeCall = new Date();
      await service.findAll({ page: 1, limit: 10 }, filters);
      const afterCall = new Date();

      expect(findAndCountSpy).toHaveBeenCalled();
      const callArgs = findAndCountSpy.mock.calls[0] as unknown as Array<{
        where: { expirationDate: { value: [Date, Date] } };
      }>;
      const [afterDate, beforeDate] = callArgs[0].where.expirationDate.value;

      // Check that "now" was properly converted to current date
      expect(afterDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(afterDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
      expect(beforeDate).toEqual(new Date('2025-12-31'));
    });

    it('should filter trainers by all string fields', async () => {
      const filters: FilterTrainerDto = {
        email: 'example.com',
        site: 'example',
        phone: '+48',
        additionalOffer: 'Individual',
        notes: 'Available',
      };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const result = await service.findAll({ page: 1, limit: 10 }, filters);

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: {
          email: Like('%example.com%'),
          site: Like('%example%'),
          phone: Like('%+48%'),
          additionalOffer: Like('%Individual%'),
          notes: Like('%Available%'),
        },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(trainers);
    });

    it('should order trainers by single field ascending', async () => {
      const ordering: OrderTrainerDto = { order: ['name:asc'] };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const result = await service.findAll(
        { page: 1, limit: 10 },
        {},
        ordering,
      );

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: {},
        order: { name: 'ASC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(trainers);
    });

    it('should order trainers by single field descending', async () => {
      const ordering: OrderTrainerDto = { order: ['city:desc'] };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const result = await service.findAll(
        { page: 1, limit: 10 },
        {},
        ordering,
      );

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: {},
        order: { city: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(trainers);
    });

    it('should order trainers by multiple fields', async () => {
      const ordering: OrderTrainerDto = {
        order: ['voivodeship:asc', 'city:asc', 'name:desc'],
      };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const result = await service.findAll(
        { page: 1, limit: 10 },
        {},
        ordering,
      );

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: {},
        order: { voivodeship: 'ASC', city: 'ASC', name: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(trainers);
    });

    it('should use default ordering when no order specified', async () => {
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const result = await service.findAll({ page: 1, limit: 10 }, {}, {});

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(trainers);
    });

    it('should combine filtering, ordering, and pagination', async () => {
      const filters: FilterTrainerDto = { city: 'Warszawa' };
      const ordering: OrderTrainerDto = { order: ['name:asc'] };
      const trainers = [mockTrainer];
      findAndCountSpy.mockResolvedValue([trainers, 1]);

      const result = await service.findAll(
        { page: 2, limit: 20 },
        filters,
        ordering,
      );

      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: { city: Like('%Warszawa%') },
        order: { name: 'ASC' },
        skip: 20,
        take: 20,
      });
      expect(result.data).toEqual(trainers);
    });
  });

  describe('findOne', () => {
    it('should return a trainer by id', async () => {
      findOneSpy.mockResolvedValue(mockTrainer);

      const result = await service.findOne(mockTrainer.id);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockTrainer.id },
      });
      expect(result).toEqual(mockTrainer);
    });

    it('should throw NotFoundException if trainer not found', async () => {
      const trainerId = 'non-existent-id';
      findOneSpy.mockResolvedValue(null);

      await expect(service.findOne(trainerId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(trainerId)).rejects.toThrow(
        `Trainer with ID ${trainerId} not found`,
      );

      expect(findOneSpy).toHaveBeenCalledWith({ where: { id: trainerId } });
    });
  });

  describe('create', () => {
    it('should create a new trainer', async () => {
      const createTrainerDto: CreateTrainerDto = {
        name: 'Jan Kowalski',
        level: 'Certyfikat',
        voivodeship: 'Mazowieckie',
        city: 'Warszawa',
        email: 'jan.kowalski@example.com',
        site: 'https://example.com',
        phone: '+48 123 456 789',
        additionalOffer: 'Individual training sessions',
        expirationDate: '2025-12-31',
        notes: 'Available on weekends',
      };

      const createdTrainer: Trainer = {
        id: 'new-trainer-id',
        ...createTrainerDto,
        expirationDate: new Date('2025-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createSpy = jest
        .spyOn(repository, 'create')
        .mockReturnValue(createdTrainer);
      saveSpy.mockResolvedValue(createdTrainer);

      const result = await service.create(createTrainerDto);

      expect(createSpy).toHaveBeenCalledWith({
        ...createTrainerDto,
        expirationDate: new Date('2025-12-31'),
      });
      expect(saveSpy).toHaveBeenCalledWith(createdTrainer);
      expect(result).toEqual(createdTrainer);
    });

    it('should create a trainer without optional fields', async () => {
      const createTrainerDto: CreateTrainerDto = {
        name: 'Jan Kowalski',
        level: 'Certyfikat',
        voivodeship: 'Mazowieckie',
        city: 'Warszawa',
        email: 'jan.kowalski@example.com',
      };

      const createdTrainer: Trainer = {
        id: 'new-trainer-id',
        ...createTrainerDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createSpy = jest
        .spyOn(repository, 'create')
        .mockReturnValue(createdTrainer);
      saveSpy.mockResolvedValue(createdTrainer);

      const result = await service.create(createTrainerDto);

      expect(createSpy).toHaveBeenCalledWith({
        ...createTrainerDto,
        expirationDate: undefined,
      });
      expect(saveSpy).toHaveBeenCalledWith(createdTrainer);
      expect(result).toEqual(createdTrainer);
    });
  });

  describe('update', () => {
    const updateTrainerDto: UpdateTrainerDto = {
      name: 'Updated Name',
    };

    it('should update a trainer', async () => {
      const updatedTrainer = { ...mockTrainer, ...updateTrainerDto };
      findOneSpy.mockResolvedValue(mockTrainer);
      saveSpy.mockResolvedValue(updatedTrainer);

      const result = await service.update(mockTrainer.id, updateTrainerDto);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockTrainer.id },
      });
      expect(saveSpy).toHaveBeenCalledWith({
        ...mockTrainer,
        ...updateTrainerDto,
      });
      expect(result).toEqual(updatedTrainer);
    });

    it('should update trainer with new expiration date', async () => {
      const updateWithDate: UpdateTrainerDto = {
        expirationDate: '2026-12-31',
      };

      findOneSpy.mockResolvedValue(mockTrainer);
      saveSpy.mockResolvedValue({
        ...mockTrainer,
        expirationDate: new Date('2026-12-31'),
      });

      const result = await service.update(mockTrainer.id, updateWithDate);

      expect(saveSpy).toHaveBeenCalledWith({
        ...mockTrainer,
        expirationDate: new Date('2026-12-31'),
      });
      expect(result.expirationDate).toEqual(new Date('2026-12-31'));
    });

    it('should throw NotFoundException if trainer not found', async () => {
      const trainerId = 'non-existent-id';
      findOneSpy.mockResolvedValue(null);

      await expect(service.update(trainerId, updateTrainerDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(trainerId, updateTrainerDto)).rejects.toThrow(
        `Trainer with ID ${trainerId} not found`,
      );

      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a trainer', async () => {
      findOneSpy.mockResolvedValue(mockTrainer);
      removeSpy.mockResolvedValue(mockTrainer);

      await service.remove(mockTrainer.id);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockTrainer.id },
      });
      expect(removeSpy).toHaveBeenCalledWith(mockTrainer);
    });

    it('should throw NotFoundException if trainer not found', async () => {
      const trainerId = 'non-existent-id';
      findOneSpy.mockResolvedValue(null);

      await expect(service.remove(trainerId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove(trainerId)).rejects.toThrow(
        `Trainer with ID ${trainerId} not found`,
      );

      expect(removeSpy).not.toHaveBeenCalled();
    });
  });
});
