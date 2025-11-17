import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto, AuthResponseDto } from '../dtos';
import { UserResponseDto } from '../../users/dtos';
import { UserRole } from '../../users/entities/enums';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthResponse: AuthResponseDto = {
    accessToken: 'mock.jwt.token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: UserRole.NORMAL,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserResponseDto,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return auth response', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const newUserResponse: AuthResponseDto = {
        ...mockAuthResponse,
        user: {
          ...mockAuthResponse.user,
          email: registerDto.email,
        },
      };

      jest.spyOn(authService, 'register').mockResolvedValue(newUserResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(newUserResponse);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(authService.register).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      jest
        .spyOn(authService, 'register')
        .mockRejectedValue(
          new ConflictException('User with this email already exists'),
        );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.register(registerDto)).rejects.toThrow(
        'User with this email already exists',
      );
    });
  });

  describe('login', () => {
    it('should return auth response when login is successful', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(authService, 'login').mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest
        .spyOn(authService, 'login')
        .mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should handle validation errors from DTO', async () => {
      const loginDto: LoginDto = {
        email: 'invalid-email',
        password: '123', // Too short
      };

      // In real scenario, this would be caught by class-validator pipe
      // Here we just verify the controller passes the DTO correctly
      jest.spyOn(authService, 'login').mockResolvedValue(mockAuthResponse);

      await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
