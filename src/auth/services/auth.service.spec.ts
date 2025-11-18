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
import {
  LoginDto,
  RegisterDto,
  ResendVerificationEmailDto,
  VerifyEmailDto,
} from '../dtos';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/entities/enums';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let emailService: EmailService;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: UserRole.NORMAL,
    emailVerificationCode: 'ABC123',
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return auth response with access token when credentials are valid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'comparePasswords').mockResolvedValue(true);
      const signSpy = jest
        .spyOn(jwtService, 'sign')
        .mockReturnValue('mock.jwt.token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
      expect(result).toHaveProperty('tokenType', 'Bearer');
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.id).toBe(mockUser.id);

      expect(signSpy).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        iss: 'workshops-api',
        aud: 'workshops-api',
      });
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

      const newUser: User = {
        id: 'new-user-id',
        email: registerDto.email,
        password: 'hashedPassword123',
        role: UserRole.NORMAL,
        emailVerificationCode: 'XYZ789',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

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

      const newUser: User = {
        id: 'new-user-id',
        email: registerDto.email,
        password: 'hashedPassword123',
        role: UserRole.NORMAL,
        emailVerificationCode: 'DEF456',
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

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
      const verifiedUser = { ...mockUser, isEmailVerified: true };

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
      const verifiedUser = { ...mockUser, isEmailVerified: true };

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
});
