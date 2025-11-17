import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrainersController } from './trainers.controller';
import { TrainersService } from '../services';
import {
  CreateTrainerDto,
  UpdateTrainerDto,
  TrainerResponseDto,
  TrainerQueryDto,
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
        voivodeship: 'Mazowieckie',
        city: 'Warszawa',
        email: 'jan.kowalski@example.com',
        site: 'https://example.com',
        phone: '+48 123 456 789',
        additionalOffer: 'Individual training sessions',
        isVerified: false,
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

      const query: TrainerQueryDto = { page: 1, limit: 10 };
      const result = await controller.findAll(query, { user: undefined });

      expect(result.data).toHaveLength(2);
      // Data is now plain objects after serialization, only public fields visible
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).not.toHaveProperty('createdAt'); // createdAt not visible to public
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(findAllSpy).toHaveBeenCalledWith({ page: 1, limit: 10 }, {}, {});
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

      const query: TrainerQueryDto = { page: 1, limit: 10 };
      const result = await controller.findAll(query, { user: undefined });

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });
      expect(findAllSpy).toHaveBeenCalledWith({ page: 1, limit: 10 }, {}, {});
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

      const query: TrainerQueryDto = {};
      const result = await controller.findAll(query, { user: undefined });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(findAllSpy).toHaveBeenCalledWith({ page: 1, limit: 10 }, {}, {});
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

      const query: TrainerQueryDto = { page: 3, limit: 20 };
      const result = await controller.findAll(query, { user: undefined });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
      expect(findAllSpy).toHaveBeenCalledWith({ page: 3, limit: 20 }, {}, {});
    });

    it('should filter trainers by name', async () => {
      const paginatedResponse = {
        data: [mockTrainer],
        total: 1,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const query: TrainerQueryDto = { page: 1, limit: 10, name: 'Jan' };
      const result = await controller.findAll(query, { user: undefined });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(findAllSpy).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        { name: 'Jan' },
        {},
      );
    });

    it('should filter trainers by multiple fields', async () => {
      const paginatedResponse = {
        data: [mockTrainer],
        total: 1,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const query: TrainerQueryDto = {
        page: 1,
        limit: 10,
        city: 'Warszawa',
        voivodeship: 'Mazowieckie',
      };
      const result = await controller.findAll(query, { user: undefined });

      expect(result.data).toHaveLength(1);
      expect(findAllSpy).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        { city: 'Warszawa', voivodeship: 'Mazowieckie' },
        {},
      );
    });

    it('should combine filtering and pagination', async () => {
      const paginatedResponse = {
        data: [mockTrainer],
        total: 50,
        page: 2,
        limit: 20,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const query: TrainerQueryDto = {
        page: 2,
        limit: 20,
        isVerified: true,
      };
      const result = await controller.findAll(query, { user: undefined });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.total).toBe(50);
      expect(findAllSpy).toHaveBeenCalledWith(
        { page: 2, limit: 20 },
        { isVerified: true },
        {},
      );
    });

    it('should order trainers by single field', async () => {
      const paginatedResponse = {
        data: [mockTrainer],
        total: 1,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const query: TrainerQueryDto = {
        page: 1,
        limit: 10,
        order: ['name:asc'],
      };
      const result = await controller.findAll(query, { user: undefined });

      expect(result.data).toHaveLength(1);
      expect(findAllSpy).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        {},
        { order: ['name:asc'] },
      );
    });

    it('should order trainers by multiple fields', async () => {
      const paginatedResponse = {
        data: [mockTrainer],
        total: 1,
        page: 1,
        limit: 10,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const query: TrainerQueryDto = {
        page: 1,
        limit: 10,
        order: ['city:asc', 'name:desc'],
      };
      const result = await controller.findAll(query, { user: undefined });

      expect(result.data).toHaveLength(1);
      expect(findAllSpy).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        {},
        { order: ['city:asc', 'name:desc'] },
      );
    });

    it('should combine filtering, ordering, and pagination', async () => {
      const paginatedResponse = {
        data: [mockTrainer],
        total: 1,
        page: 2,
        limit: 20,
      };

      const findAllSpy = jest
        .spyOn(trainersService, 'findAll')
        .mockResolvedValue(paginatedResponse);

      const query: TrainerQueryDto = {
        page: 2,
        limit: 20,
        city: 'Warszawa',
        order: ['name:asc'],
      };
      const result = await controller.findAll(query, { user: undefined });

      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(findAllSpy).toHaveBeenCalledWith(
        { page: 2, limit: 20 },
        { city: 'Warszawa' },
        { order: ['name:asc'] },
      );
    });
  });

  describe('findOne', () => {
    it('should return a trainer response DTO by id', async () => {
      const findOneSpy = jest
        .spyOn(trainersService, 'findOne')
        .mockResolvedValue(mockTrainer);

      const result = (await controller.findOne(mockTrainer.id, {
        user: undefined,
      })) as Record<string, any>;

      // Result is now a plain object with only public fields
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).not.toHaveProperty('createdAt'); // createdAt not visible to public
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
