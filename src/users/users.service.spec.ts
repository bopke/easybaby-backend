import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;
  let findOneSpy: jest.SpyInstance;
  let findSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;
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
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
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

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    findOneSpy = jest.spyOn(repository, 'findOne');
    findSpy = jest.spyOn(repository, 'find');
    saveSpy = jest.spyOn(repository, 'save');
    removeSpy = jest.spyOn(repository, 'remove');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        mockUser,
        { ...mockUser, id: '2', email: 'user2@test.com' },
      ];
      findSpy.mockResolvedValue(users);

      const result = await service.findAll();

      expect(findSpy).toHaveBeenCalled();
      expect(result).toEqual(users);
    });

    it('should return an empty array if no users exist', async () => {
      findSpy.mockResolvedValue([]);

      const result = await service.findAll();

      expect(findSpy).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      findOneSpy.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      findOneSpy.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(userId)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );

      expect(findOneSpy).toHaveBeenCalledWith({ where: { id: userId } });
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      findOneSpy.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      findOneSpy.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      email: 'updated@example.com',
    };

    it('should update a user', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      findOneSpy.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);
      saveSpy.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateUserDto);

      expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: updateUserDto.email },
      });
      expect(saveSpy).toHaveBeenCalledWith({
        ...mockUser,
        ...updateUserDto,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should hash password when updating password', async () => {
      const updateWithPassword: UpdateUserDto = {
        password: 'newPassword123',
      };
      const hashedPassword = 'newHashedPassword';

      findOneSpy.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      saveSpy.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.update(mockUser.id, updateWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(updateWithPassword.password, 10);
      expect(saveSpy).toHaveBeenCalledWith({
        ...mockUser,
        password: hashedPassword,
      });
      expect(result.password).toEqual(hashedPassword);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      findOneSpy.mockResolvedValue(null);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );

      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = { ...mockUser, id: 'another-id' };
      const updateDtoWithNewEmail: UpdateUserDto = {
        email: 'newemail@example.com',
      };

      findOneSpy.mockImplementation(
        (options: { where: { id?: string; email?: string } }) => {
          if (options.where.id === mockUser.id) {
            return Promise.resolve(mockUser);
          }
          if (options.where.email === updateDtoWithNewEmail.email) {
            return Promise.resolve(existingUser);
          }
          return Promise.resolve(null);
        },
      );

      await expect(
        service.update(mockUser.id, updateDtoWithNewEmail),
      ).rejects.toThrow('User with this email already exists');

      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should not check email conflict if email is not being updated', async () => {
      const updateWithoutEmail: UpdateUserDto = {
        password: 'newPassword123',
      };

      findOneSpy.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      saveSpy.mockResolvedValue(mockUser);

      await service.update(mockUser.id, updateWithoutEmail);

      // Should only be called once (to find the user)
      expect(findOneSpy).toHaveBeenCalledTimes(1);
    });

    it('should not check email conflict if email is the same', async () => {
      const updateSameEmail: UpdateUserDto = {
        email: mockUser.email,
      };

      findOneSpy.mockResolvedValue(mockUser);
      saveSpy.mockResolvedValue(mockUser);

      await service.update(mockUser.id, updateSameEmail);

      // Should only be called once (to find the user)
      expect(findOneSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      findOneSpy.mockResolvedValue(mockUser);
      removeSpy.mockResolvedValue(mockUser);

      await service.remove(mockUser.id);

      expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(removeSpy).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'non-existent-id';
      findOneSpy.mockResolvedValue(null);

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(userId)).rejects.toThrow(
        `User with ID ${userId} not found`,
      );

      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.comparePasswords(
        'plainPassword',
        'hashedPassword',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plainPassword',
        'hashedPassword',
      );
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.comparePasswords(
        'plainPassword',
        'hashedPassword',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plainPassword',
        'hashedPassword',
      );
      expect(result).toBe(false);
    });
  });
});
