import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/enums';
import { mockUser, createMockUser } from '../mocks';
import { CreateUserDto, UpdateUserDto } from '../dtos';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;
  let findOneSpy: jest.SpyInstance;
  let findSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;
  let removeSpy: jest.SpyInstance;

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
        createMockUser({ id: '2', email: 'user2@test.com' }),
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
      const updatedUser = createMockUser(updateUserDto);
      findOneSpy.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);
      saveSpy.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateUserDto);

      expect(findOneSpy).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: updateUserDto.email },
      });
      expect(saveSpy).toHaveBeenCalledWith(createMockUser(updateUserDto));
      expect(result).toEqual(updatedUser);
    });

    it('should hash password when updating password', async () => {
      const updateWithPassword: UpdateUserDto = {
        password: 'newPassword123',
      };
      const hashedPassword = 'newHashedPassword';

      findOneSpy.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      const updatedMockUser = { ...mockUser, password: hashedPassword };
      saveSpy.mockResolvedValue(updatedMockUser);

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
      const existingUser = createMockUser({ id: 'another-id' });
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

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashedPassword123';
      const createdUser: User = {
        id: 'new-user-id',
        email: createUserDto.email,
        password: hashedPassword,
        role: UserRole.NORMAL,
        emailVerificationCode: 'ABC123',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      findOneSpy.mockResolvedValue(null); // No existing user
      const hashSpy = (bcrypt.hash as jest.Mock).mockResolvedValue(
        hashedPassword,
      );
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockReturnValue(createdUser);
      saveSpy.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(hashSpy).toHaveBeenCalledWith('password123', 10);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createUserDto.email,
          password: hashedPassword,
          role: UserRole.NORMAL,
          isEmailVerified: false,
        }),
      );
      const createCallArgs = createSpy.mock.calls[0][0];
      expect(createCallArgs.emailVerificationCode).toBeTruthy();
      expect(typeof createCallArgs.emailVerificationCode).toBe('string');
      expect(createCallArgs.emailVerificationCode).toHaveLength(6);
      expect(saveSpy).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(createdUser);
      expect(result.role).toBe(UserRole.NORMAL);
    });

    it('should throw ConflictException if user already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      findOneSpy.mockResolvedValue(mockUser);
      const createSpy = jest.spyOn(repository, 'create');

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'User with this email already exists',
      );

      expect(createSpy).not.toHaveBeenCalled();
      expect(saveSpy).not.toHaveBeenCalled();
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

  describe('verifyEmail', () => {
    it('should verify email when code matches', async () => {
      const verifiedUser = createMockUser({ isEmailVerified: true });

      findOneSpy.mockResolvedValue(mockUser);
      saveSpy.mockResolvedValue(verifiedUser);

      const result = await service.verifyEmail(
        mockUser.email,
        mockUser.emailVerificationCode,
      );

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(saveSpy).toHaveBeenCalled();
      expect(result).toBeTruthy();
      expect(result?.isEmailVerified).toBe(true);
    });

    it('should return null when user not found', async () => {
      findOneSpy.mockResolvedValue(null);

      const result = await service.verifyEmail(
        'nonexistent@example.com',
        'ABC123',
      );

      expect(result).toBeNull();
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should return null when verification code does not match', async () => {
      findOneSpy.mockResolvedValue(mockUser);

      const result = await service.verifyEmail(mockUser.email, 'WRONG1');

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(result).toBeNull();
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });
});
