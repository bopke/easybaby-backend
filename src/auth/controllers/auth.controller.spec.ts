import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import {
  LoginDto,
  RegisterDto,
  AuthResponseDto,
  ResendVerificationEmailDto,
  VerifyEmailDto,
  RefreshTokenDto,
  SessionResponseDto,
} from '../dtos';
import { UserResponseDto } from '../../users/dtos';
import { UserRole } from '../../users/entities/enums';
import { Request } from 'express';

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
    refreshToken: 'mock.refresh.token',
    refreshTokenExpiresIn: 2592000,
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
            resendVerificationEmail: jest.fn(),
            verifyEmail: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
            logoutAllDevices: jest.fn(),
            getSessions: jest.fn(),
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
    it('should register a new user and return success message', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const expectedResponse = {
        message:
          'Registration successful. Please check your email to verify your account.',
      };

      const registerSpy = jest
        .spyOn(authService, 'register')
        .mockResolvedValue(expectedResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResponse);
      expect(registerSpy).toHaveBeenCalledWith(registerDto);
      expect(registerSpy).toHaveBeenCalledTimes(1);
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
    it('should return auth response with refresh token when login is successful', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0' },
      } as Request;

      const loginSpy = jest
        .spyOn(authService, 'login')
        .mockResolvedValue(mockAuthResponse);

      const result = await controller.login(
        loginDto,
        '192.168.1.1',
        mockRequest,
      );

      expect(result).toEqual(mockAuthResponse);
      expect(result).toHaveProperty('refreshToken', 'mock.refresh.token');
      expect(result).toHaveProperty('refreshTokenExpiresIn', 2592000);
      expect(loginSpy).toHaveBeenCalledWith(
        loginDto,
        '192.168.1.1',
        'Mozilla/5.0',
      );
      expect(loginSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0' },
      } as Request;

      jest
        .spyOn(authService, 'login')
        .mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(
        controller.login(loginDto, '192.168.1.1', mockRequest),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        controller.login(loginDto, '192.168.1.1', mockRequest),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should handle validation errors from DTO', async () => {
      const loginDto: LoginDto = {
        email: 'invalid-email',
        password: '123', // Too short
      };

      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0' },
      } as Request;

      // In real scenario, this would be caught by class-validator pipe
      // Here we just verify the controller passes the DTO correctly
      const loginSpy = jest
        .spyOn(authService, 'login')
        .mockResolvedValue(mockAuthResponse);

      await controller.login(loginDto, '192.168.1.1', mockRequest);

      expect(loginSpy).toHaveBeenCalledWith(
        loginDto,
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email and return success message', async () => {
      const resendDto: ResendVerificationEmailDto = {
        email: 'test@example.com',
      };

      const expectedResponse = {
        message: 'Verification email has been sent successfully',
      };

      const resendSpy = jest
        .spyOn(authService, 'resendVerificationEmail')
        .mockResolvedValue(expectedResponse);

      const result = await controller.resendVerificationEmail(resendDto);

      expect(result).toEqual(expectedResponse);
      expect(resendSpy).toHaveBeenCalledWith(resendDto);
      expect(resendSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user is not found', async () => {
      const resendDto: ResendVerificationEmailDto = {
        email: 'nonexistent@example.com',
      };

      jest
        .spyOn(authService, 'resendVerificationEmail')
        .mockRejectedValue(
          new NotFoundException('User with this email not found'),
        );

      await expect(
        controller.resendVerificationEmail(resendDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.resendVerificationEmail(resendDto),
      ).rejects.toThrow('User with this email not found');
    });

    it('should throw BadRequestException when email is already verified', async () => {
      const resendDto: ResendVerificationEmailDto = {
        email: 'verified@example.com',
      };

      jest
        .spyOn(authService, 'resendVerificationEmail')
        .mockRejectedValue(
          new BadRequestException('Email is already verified'),
        );

      await expect(
        controller.resendVerificationEmail(resendDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.resendVerificationEmail(resendDto),
      ).rejects.toThrow('Email is already verified');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and return success message', async () => {
      const verifyDto: VerifyEmailDto = {
        email: 'test@example.com',
        verificationCode: 'ABC123',
      };

      const expectedResponse = {
        message: 'Email verified successfully',
      };

      const verifySpy = jest
        .spyOn(authService, 'verifyEmail')
        .mockResolvedValue(expectedResponse);

      const result = await controller.verifyEmail(verifyDto);

      expect(result).toEqual(expectedResponse);
      expect(verifySpy).toHaveBeenCalledWith(verifyDto);
      expect(verifySpy).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when verification code is invalid', async () => {
      const verifyDto: VerifyEmailDto = {
        email: 'test@example.com',
        verificationCode: 'WRONG1',
      };

      jest
        .spyOn(authService, 'verifyEmail')
        .mockRejectedValue(
          new BadRequestException(
            'Invalid verification code or user not found',
          ),
        );

      await expect(controller.verifyEmail(verifyDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.verifyEmail(verifyDto)).rejects.toThrow(
        'Invalid verification code or user not found',
      );
    });

    it('should throw BadRequestException when user not found', async () => {
      const verifyDto: VerifyEmailDto = {
        email: 'nonexistent@example.com',
        verificationCode: 'ABC123',
      };

      jest
        .spyOn(authService, 'verifyEmail')
        .mockRejectedValue(
          new BadRequestException(
            'Invalid verification code or user not found',
          ),
        );

      await expect(controller.verifyEmail(verifyDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.verifyEmail(verifyDto)).rejects.toThrow(
        'Invalid verification code or user not found',
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshDto: RefreshTokenDto = {
        refreshToken: 'valid.refresh.token',
      };

      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0' },
      } as Request;

      const refreshSpy = jest
        .spyOn(authService, 'refreshTokens')
        .mockResolvedValue(mockAuthResponse);

      const result = await controller.refreshTokens(
        refreshDto,
        '192.168.1.1',
        mockRequest,
      );

      expect(result).toEqual(mockAuthResponse);
      expect(refreshSpy).toHaveBeenCalledWith(
        refreshDto,
        '192.168.1.1',
        'Mozilla/5.0',
      );
      expect(refreshSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      const refreshDto: RefreshTokenDto = {
        refreshToken: 'invalid.refresh.token',
      };

      const mockRequest = {
        headers: { 'user-agent': 'Mozilla/5.0' },
      } as Request;

      jest
        .spyOn(authService, 'refreshTokens')
        .mockRejectedValue(
          new UnauthorizedException('Invalid or expired refresh token'),
        );

      await expect(
        controller.refreshTokens(refreshDto, '192.168.1.1', mockRequest),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const refreshDto: RefreshTokenDto = {
        refreshToken: 'valid.refresh.token',
      };

      const expectedResponse = {
        message: 'Logged out successfully',
      };

      const logoutSpy = jest
        .spyOn(authService, 'logout')
        .mockResolvedValue(expectedResponse);

      const result = await controller.logout(refreshDto);

      expect(result).toEqual(expectedResponse);
      expect(logoutSpy).toHaveBeenCalledWith('valid.refresh.token');
      expect(logoutSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('logoutAllDevices', () => {
    it('should logout from all devices successfully', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
      };

      const expectedResponse = {
        message: 'Logged out from all devices successfully',
      };

      const logoutAllSpy = jest
        .spyOn(authService, 'logoutAllDevices')
        .mockResolvedValue(expectedResponse);

      const result = await controller.logoutAllDevices(mockUser);

      expect(result).toEqual(expectedResponse);
      expect(logoutAllSpy).toHaveBeenCalledWith(mockUser.id);
      expect(logoutAllSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSessions', () => {
    it('should return all active sessions', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
      };

      const mockSessionData: SessionResponseDto[] = [
        {
          id: 'session-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
          lastUsedAt: null,
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: 'session-2',
          ipAddress: '192.168.1.2',
          userAgent: 'Chrome/100.0',
          createdAt: new Date(),
          lastUsedAt: new Date(),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ];

      const mockResponse = {
        data: mockSessionData,
        total: 2,
        page: 1,
        limit: 10,
      };

      const getSessionsSpy = jest
        .spyOn(authService, 'getSessions')
        .mockResolvedValue(mockResponse);

      const result = await controller.getSessions(mockUser, {});

      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(2);
      expect(getSessionsSpy).toHaveBeenCalledWith(
        mockUser.id,
        { page: 1, limit: 10 },
        {},
        { order: undefined },
      );
      expect(getSessionsSpy).toHaveBeenCalledTimes(1);
    });
  });
});
