import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrainersController } from './trainers.controller';
import { TrainersService } from '../services';
import {
  CreateTrainerDto,
  UpdateTrainerDto,
  TrainerResponseDto,
  FilterTrainerDto,
} from '../dtos';
import { mockTrainer } from '../mocks';

describe('TrainersController', () => {
  let controller: TrainersController;
  let trainersService: TrainersService;

  const mockTrainerResponse: TrainerResponseDto =
    TrainerResponseDto.fromEntity(mockTrainer);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainersController],
      providers: [
        {
          provide: TrainersService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TrainersController>(TrainersController);
    trainersService = module.get<TrainersService>(TrainersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new trainer and return response DTO', async () => {
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

      const createSpy = jest
        .spyOn(trainersService, 'create')
        .mockResolvedValue(mockTrainer);

      const result = await controller.create(createTrainerDto);

      expect(result).toEqual(mockTrainerResponse);
      expect(createSpy).toHaveBeenCalledWith(createTrainerDto);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return a paginated response of trainer DTOs', async () => {
      const trainers = [
        mockTrainer,
        { ...mockTrainer, id: '2', name: 'Anna Nowak' },
      ];

      const paginatedResponse = {
        data: trainers,
        total: 2,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(1, 10, {});

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toBeInstanceOf(TrainerResponseDto);
      expect(result.data[1]).toBeInstanceOf(TrainerResponseDto);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(findAllSpy).toHaveBeenCalledWith({ page: 1, limit: 10 }, {});
      expect(findAllSpy).toHaveBeenCalledTimes(1);
    });

    it('should return an empty paginated response if no trainers exist', async () => {
      const paginatedResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(1, 10, {});

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });
      expect(findAllSpy).toHaveBeenCalledWith({ page: 1, limit: 10 }, {});
    });

    it('should use default pagination parameters when not provided', async () => {
      const paginatedResponse = {
        data: [mockTrainer],
        total: 1,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.findAll();

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(findAllSpy).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        undefined,
      );
    });

    it('should handle custom pagination parameters', async () => {
      const paginatedResponse = {
        data: [mockTrainer],
        total: 50,
        page: 3,
        limit: 20,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(3, 20, {});

      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
      expect(findAllSpy).toHaveBeenCalledWith({ page: 3, limit: 20 }, {});
    });

    it('should filter trainers by name', async () => {
      const filters: FilterTrainerDto = { name: 'Jan' };
      const paginatedResponse = {
        data: [mockTrainer],
        total: 1,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(1, 10, filters);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(findAllSpy).toHaveBeenCalledWith({ page: 1, limit: 10 }, filters);
    });

    it('should filter trainers by multiple fields', async () => {
      const filters: FilterTrainerDto = {
        city: 'Warszawa',
        voivodeship: 'Mazowieckie',
      };
      const paginatedResponse = {
        data: [mockTrainer],
        total: 1,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(1, 10, filters);

      expect(result.data).toHaveLength(1);
      expect(findAllSpy).toHaveBeenCalledWith({ page: 1, limit: 10 }, filters);
    });

    it('should combine filtering and pagination', async () => {
      const filters: FilterTrainerDto = { level: 'Certyfikat' };
      const paginatedResponse = {
        data: [mockTrainer],
        total: 50,
        page: 2,
        limit: 20,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(2, 20, filters);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(50);
      expect(findAllSpy).toHaveBeenCalledWith({ page: 2, limit: 20 }, filters);
    });

    it('should filter trainers by expiration date before', async () => {
      const filters: FilterTrainerDto = { expirationDateBefore: '2025-12-31' };
      const paginatedResponse = {
        data: [mockTrainer],
        total: 1,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(1, 10, filters);

      expect(result.data).toHaveLength(1);
      expect(findAllSpy).toHaveBeenCalledWith({ page: 1, limit: 10 }, filters);
    });

    it('should filter trainers by expiration date after', async () => {
      const filters: FilterTrainerDto = { expirationDateAfter: '2025-01-01' };
      const paginatedResponse = {
        data: [mockTrainer],
        total: 1,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(1, 10, filters);

      expect(result.data).toHaveLength(1);
      expect(findAllSpy).toHaveBeenCalledWith({ page: 1, limit: 10 }, filters);
    });

    it('should filter trainers using "now" as date value', async () => {
      const filters: FilterTrainerDto = { expirationDateBefore: 'now' };
      const paginatedResponse = {
        data: [mockTrainer],
        total: 1,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const result = await controller.findAll(1, 10, filters);

      expect(result.data).toHaveLength(1);
      expect(findAllSpy).toHaveBeenCalledWith({ page: 1, limit: 10 }, filters);
    });
  });

  describe('findOne', () => {
    it('should return a trainer response DTO by id', async () => {
      const findOneSpy = jest
        .spyOn(trainersService, 'findOne')
        .mockResolvedValue(mockTrainer);

      const result = await controller.findOne(mockTrainer.id);

      expect(result).toEqual(mockTrainerResponse);
      expect(findOneSpy).toHaveBeenCalledWith(mockTrainer.id);
      expect(findOneSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when trainer not found', async () => {
      const trainerId = 'non-existent-id';
      jest
        .spyOn(trainersService, 'findOne')
        .mockRejectedValue(
          new NotFoundException(`Trainer with ID ${trainerId} not found`),
        );

      await expect(controller.findOne(trainerId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne(trainerId)).rejects.toThrow(
        `Trainer with ID ${trainerId} not found`,
      );
    });
  });

  describe('update', () => {
    it('should update a trainer and return response DTO', async () => {
      const updateTrainerDto: UpdateTrainerDto = {
        name: 'Updated Name',
      };

      const updatedTrainer = { ...mockTrainer, name: 'Updated Name' };

      const updateSpy = jest
        .spyOn(trainersService, 'update')
        .mockResolvedValue(updatedTrainer);

      const result = await controller.update(mockTrainer.id, updateTrainerDto);

      expect(result.name).toBe('Updated Name');
      expect(updateSpy).toHaveBeenCalledWith(mockTrainer.id, updateTrainerDto);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when trainer not found', async () => {
      const trainerId = 'non-existent-id';
      const updateTrainerDto: UpdateTrainerDto = {
        name: 'Updated Name',
      };

      jest
        .spyOn(trainersService, 'update')
        .mockRejectedValue(
          new NotFoundException(`Trainer with ID ${trainerId} not found`),
        );

      await expect(
        controller.update(trainerId, updateTrainerDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.update(trainerId, updateTrainerDto),
      ).rejects.toThrow(`Trainer with ID ${trainerId} not found`);
    });
  });

  describe('remove', () => {
    it('should remove a trainer', async () => {
      const removeSpy = jest
        .spyOn(trainersService, 'remove')
        .mockResolvedValue(undefined);

      await controller.remove(mockTrainer.id);

      expect(removeSpy).toHaveBeenCalledWith(mockTrainer.id);
      expect(removeSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when trainer not found', async () => {
      const trainerId = 'non-existent-id';

      jest
        .spyOn(trainersService, 'remove')
        .mockRejectedValue(
          new NotFoundException(`Trainer with ID ${trainerId} not found`),
        );

      await expect(controller.remove(trainerId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.remove(trainerId)).rejects.toThrow(
        `Trainer with ID ${trainerId} not found`,
      );
    });
  });
});
