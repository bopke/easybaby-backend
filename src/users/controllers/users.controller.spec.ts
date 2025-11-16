import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dtos';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/enums';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  let findAllSpy: jest.SpyInstance;
  let findOneSpy: jest.SpyInstance;
  let updateSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: UserRole.NORMAL,
    createdAt: new Date('2024-01-15T10:30:00.000Z'),
    updatedAt: new Date('2024-01-15T10:30:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    findAllSpy = jest.spyOn(service, 'findAll');
    findOneSpy = jest.spyOn(service, 'findOne');
    updateSpy = jest.spyOn(service, 'update');
    removeSpy = jest.spyOn(service, 'remove');
  });

  describe('findAll', () => {
    it('should return an array of users without passwords', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: '2', email: 'user2@test.com' },
      ];
      findAllSpy.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('password');
      expect(result[0]).toEqual({
        id: users[0].id,
        email: users[0].email,
        role: users[0].role,
        createdAt: users[0].createdAt,
        updatedAt: users[0].updatedAt,
      });
    });

    it('should return an empty array if no users exist', async () => {
      findAllSpy.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(findAllSpy).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user without password', async () => {
      findOneSpy.mockResolvedValue(mockUser);

      const result = await controller.findOne(mockUser.id);

      expect(findOneSpy).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      findOneSpy.mockRejectedValue(
        new NotFoundException(`User with ID ${userId} not found`),
      );

      await expect(controller.findOne(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
    };

    it('should update a user and return UserResponseDto without password', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      updateSpy.mockResolvedValue(updatedUser);

      const result = await controller.update(mockUser.id, updateUserDto);

      expect(updateSpy).toHaveBeenCalledWith(mockUser.id, updateUserDto);
      expect(result).toEqual({
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      updateSpy.mockRejectedValue(
        new NotFoundException(`User with ID ${userId} not found`),
      );

      await expect(controller.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      updateSpy.mockRejectedValue(
        new ConflictException('User with this email already exists'),
      );

      await expect(
        controller.update(mockUser.id, updateUserDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      removeSpy.mockResolvedValue(undefined);

      await controller.remove(mockUser.id);

      expect(removeSpy).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      removeSpy.mockRejectedValue(
        new NotFoundException(`User with ID ${userId} not found`),
      );

      await expect(controller.remove(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
