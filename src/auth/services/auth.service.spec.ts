import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../../users/services/users.service';
import { EmailService } from '../../email/services/email.service';
import { RefreshTokenService } from './refresh-token.service';
import {
  LoginDto,
  RegisterDto,
  ResendVerificationEmailDto,
  VerifyEmailDto,
  RefreshTokenDto,
} from '../dtos';
import { mockUser, createMockUser } from '../../users/mocks';
import { createMockRefreshToken } from '../mocks';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let emailService: EmailService;
  let refreshTokenService: RefreshTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findOne: jest.fn(),
            comparePasswords: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
            regenerateVerificationCode: jest.fn(),
            verifyEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'jwt.issuer': 'workshops-api',
                'jwt.audience': 'workshops-api',
              };
              return config[key];
            }),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendRegistrationEmail: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            generateRefreshToken: jest.fn(),
            validateRefreshToken: jest.fn(),
            rotateRefreshToken: jest.fn(),
            revokeTokenByJti: jest.fn(),
            revokeAllUserTokens: jest.fn(),
            getUserSessions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return auth response with access and refresh tokens when credentials are valid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'comparePasswords').mockResolvedValue(true);
      const signSpy = jest
        .spyOn(jwtService, 'sign')
        .mockReturnValue('mock.jwt.token');
      const generateRefreshSpy = jest
        .spyOn(refreshTokenService, 'generateRefreshToken')
        .mockResolvedValue({
          token: 'mock.refresh.token',
          expiresIn: 2592000,
        });

      const result = await service.login(
        loginDto,
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
      expect(result).toHaveProperty('tokenType', 'Bearer');
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(result).toHaveProperty('refreshToken', 'mock.refresh.token');
      expect(result).toHaveProperty('refreshTokenExpiresIn', 2592000);
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.id).toBe(mockUser.id);

      expect(signSpy).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        iss: 'workshops-api',
        aud: 'workshops-api',
      });
      expect(generateRefreshSpy).toHaveBeenCalledWith(
        mockUser,
        '192.168.1.1',
        'Mozilla/5.0',
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'comparePasswords').mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('register', () => {
    it('should register a new user and return success message', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const newUser = createMockUser({
        id: 'new-user-id',
        email: registerDto.email,
        emailVerificationCode: 'XYZ789',
      });

      const createSpy = jest
        .spyOn(usersService, 'create')
        .mockResolvedValue(newUser);
      const sendEmailSpy = jest
        .spyOn(emailService, 'sendRegistrationEmail')
        .mockResolvedValue();

      const result = await service.register(registerDto);

      expect(result).toEqual({
        message:
          'Registration successful. Please check your email to verify your account.',
      });

      expect(createSpy).toHaveBeenCalledWith({
        email: registerDto.email,
        password: registerDto.password,
      });
      expect(sendEmailSpy).toHaveBeenCalledWith(newUser);
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(
          new ConflictException('User with this email already exists'),
        );

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'User with this email already exists',
      );
    });

    it('should fail registration when email sending fails', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
      };

      const newUser = createMockUser({
        id: 'new-user-id',
        email: registerDto.email,
        emailVerificationCode: 'DEF456',
      });

      jest.spyOn(usersService, 'create').mockResolvedValue(newUser);
      const removeSpy = jest
        .spyOn(usersService, 'remove')
        .mockResolvedValue(undefined);
      jest
        .spyOn(emailService, 'sendRegistrationEmail')
        .mockRejectedValue(new Error('Failed to send email'));

      await expect(service.register(registerDto)).rejects.toThrow(
        'Failed to send email',
      );

      expect(removeSpy).toHaveBeenCalledWith(newUser.id);
    });
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const findByEmailSpy = jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser);
      const comparePasswordsSpy = jest
        .spyOn(usersService, 'comparePasswords')
        .mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toEqual(mockUser);
      expect(findByEmailSpy).toHaveBeenCalledWith('test@example.com');
      expect(comparePasswordsSpy).toHaveBeenCalledWith(
        'password123',
        mockUser.password,
      );
    });

    it('should return null when user is not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'comparePasswords').mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('resendVerificationEmail', () => {
    const resendDto: ResendVerificationEmailDto = {
      email: 'test@example.com',
    };

    it('should resend verification email with new code', async () => {
      const findByEmailSpy = jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser);

      const result = await service.resendVerificationEmail(resendDto);

      expect(result).toEqual({
        message: 'Verification email has been sent successfully',
      });
      expect(findByEmailSpy).toHaveBeenCalledWith(resendDto.email);
    });

    it('should throw NotFoundException when user is not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(service.resendVerificationEmail(resendDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.resendVerificationEmail(resendDto)).rejects.toThrow(
        'User with this email not found',
      );
    });

    it('should throw BadRequestException when email is already verified', async () => {
      const verifiedUser = createMockUser({ isEmailVerified: true });

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(verifiedUser);

      await expect(service.resendVerificationEmail(resendDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resendVerificationEmail(resendDto)).rejects.toThrow(
        'Email is already verified',
      );
    });
  });

  describe('verifyEmail', () => {
    const verifyDto: VerifyEmailDto = {
      email: 'test@example.com',
      verificationCode: 'ABC123',
    };

    it('should verify email successfully when code is valid', async () => {
      const verifiedUser = createMockUser({ isEmailVerified: true });

      const verifyEmailSpy = jest
        .spyOn(usersService, 'verifyEmail')
        .mockResolvedValue(verifiedUser);

      const result = await service.verifyEmail(verifyDto);

      expect(result).toEqual({
        message: 'Email verified successfully',
      });
      expect(verifyEmailSpy).toHaveBeenCalledWith(
        verifyDto.email,
        verifyDto.verificationCode,
      );
    });

    it('should throw BadRequestException when user not found', async () => {
      jest.spyOn(usersService, 'verifyEmail').mockResolvedValue(null);

      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(
        'Invalid verification code or user not found',
      );
    });

    it('should throw BadRequestException when verification code is invalid', async () => {
      const invalidDto: VerifyEmailDto = {
        email: 'test@example.com',
        verificationCode: 'WRONG1',
      };

      jest.spyOn(usersService, 'verifyEmail').mockResolvedValue(null);

      await expect(service.verifyEmail(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail(invalidDto)).rejects.toThrow(
        'Invalid verification code or user not found',
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh access and refresh tokens successfully', async () => {
      const refreshDto: RefreshTokenDto = {
        refreshToken: 'valid.refresh.token',
      };
      const mockPayload = {
        sub: mockUser.id,
        jti: 'old-jti',
        type: 'refresh' as const,
        family: 'family-123',
      };

      const validateSpy = jest
        .spyOn(refreshTokenService, 'validateRefreshToken')
        .mockResolvedValue(mockPayload);
      const findOneSpy = jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(mockUser);
      const rotateSpy = jest
        .spyOn(refreshTokenService, 'rotateRefreshToken')
        .mockResolvedValue({
          token: 'new.refresh.token',
          expiresIn: 2592000,
        });
      const signSpy = jest
        .spyOn(jwtService, 'sign')
        .mockReturnValue('new.access.token');

      const result = await service.refreshTokens(
        refreshDto,
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(result).toHaveProperty('accessToken', 'new.access.token');
      expect(result).toHaveProperty('refreshToken', 'new.refresh.token');
      expect(result).toHaveProperty('refreshTokenExpiresIn', 2592000);
      expect(validateSpy).toHaveBeenCalledWith(
        'valid.refresh.token',
        '192.168.1.1',
        'Mozilla/5.0',
      );
      expect(findOneSpy).toHaveBeenCalledWith(mockUser.id);
      expect(rotateSpy).toHaveBeenCalledWith(
        'valid.refresh.token',
        mockUser,
        '192.168.1.1',
        'Mozilla/5.0',
      );
      expect(signSpy).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout from current session successfully', async () => {
      const refreshToken = 'valid.refresh.token';
      const mockPayload = {
        sub: mockUser.id,
        jti: 'jti-123',
        type: 'refresh' as const,
        family: 'family-123',
      };

      const validateSpy = jest
        .spyOn(refreshTokenService, 'validateRefreshToken')
        .mockResolvedValue(mockPayload);
      const revokeSpy = jest
        .spyOn(refreshTokenService, 'revokeTokenByJti')
        .mockResolvedValue();

      const result = await service.logout(refreshToken);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(validateSpy).toHaveBeenCalledWith(refreshToken);
      expect(revokeSpy).toHaveBeenCalledWith('jti-123');
    });
  });

  describe('logoutAllDevices', () => {
    it('should logout from all devices successfully', async () => {
      const revokeSpy = jest
        .spyOn(refreshTokenService, 'revokeAllUserTokens')
        .mockResolvedValue();

      const result = await service.logoutAllDevices(mockUser.id);

      expect(result).toEqual({
        message: 'Logged out from all devices successfully',
      });
      expect(revokeSpy).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getSessions', () => {
    it('should return paginated sessions for a user', async () => {
      const mockSessions = [
        createMockRefreshToken({
          id: 'session-1',
          jti: 'jti-1',
          tokenFamily: 'family-1',
        }),
        createMockRefreshToken({
          id: 'session-2',
          jti: 'jti-2',
          lastUsedAt: new Date(),
          ipAddress: '192.168.1.2',
          userAgent: 'Chrome/100.0',
          tokenFamily: 'family-2',
        }),
      ];

      const getUserSessionsSpy = jest
        .spyOn(refreshTokenService, 'getUserSessions')
        .mockResolvedValue({
          data: mockSessions,
          total: 2,
          page: 1,
          limit: 10,
        });

      const result = await service.getSessions(mockUser.id);

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('id', 'session-1');
      expect(result.data[1]).toHaveProperty('id', 'session-2');
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(getUserSessionsSpy).toHaveBeenCalledWith(
        mockUser.id,
        { page: 1, limit: 10 },
        {},
        {},
      );
    });
  });
});
