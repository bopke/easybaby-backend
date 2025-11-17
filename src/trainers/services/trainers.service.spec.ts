import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { Trainer } from '../entities';
import { CreateTrainerDto, UpdateTrainerDto } from '../dtos';
import { mockTrainer } from '../mocks';

describe('TrainersService', () => {
  let service: TrainersService;
  let repository: Repository<Trainer>;
  let findOneSpy: jest.SpyInstance;
  let findSpy: jest.SpyInstance;
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
            find: jest.fn(),
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
    findSpy = jest.spyOn(repository, 'find');
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
    it('should return an array of trainers', async () => {
      const trainers = [
        mockTrainer,
        { ...mockTrainer, id: '2', name: 'Anna Nowak' },
      ];
      findSpy.mockResolvedValue(trainers);

      const result = await service.findAll();

      expect(findSpy).toHaveBeenCalled();
      expect(result).toEqual(trainers);
    });

    it('should return an empty array if no trainers exist', async () => {
      findSpy.mockResolvedValue([]);

      const result = await service.findAll();

      expect(findSpy).toHaveBeenCalled();
      expect(result).toEqual([]);
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
