import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenService } from './refresh-token.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import {
  Repository,
  UpdateResult,
  DataSource,
  QueryFailedError,
} from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { mockUser } from '../../users/mocks';
import { createMockRefreshToken } from '../mocks';
import { PaginationService } from '../../common/services/pagination.service';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let repository: Repository<RefreshToken>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockRefreshTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        findOne: jest.fn(),
      },
    }),
    getMetadata: jest.fn().mockReturnValue({
      columns: [
        { propertyName: 'id' },
        { propertyName: 'jti' },
        { propertyName: 'userId' },
        { propertyName: 'tokenFamily' },
        { propertyName: 'isRevoked' },
        { propertyName: 'expiresAt' },
        { propertyName: 'ipAddress' },
        { propertyName: 'userAgent' },
        { propertyName: 'lastUsedAt' },
        { propertyName: 'createdAt' },
        { propertyName: 'updatedAt' },
      ],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        PaginationService,
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    repository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    // Default config values
    jest.spyOn(configService, 'get').mockImplementation((key: string) => {
      const config: Record<string, any> = {
        'refreshToken.secret': 'test-refresh-secret',
        'refreshToken.expiration': 2592000, // 30 days
      };
      return config[key];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRefreshToken', () => {
    it('should generate and store a refresh token', async () => {
      const mockToken = 'mock.jwt.token';
      const mockRefreshToken = createMockRefreshToken({
        expiresAt: new Date(Date.now() + 2592000 * 1000),
      });

      const signSpy = jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);
      const createSpy = jest
        .spyOn(repository, 'create')
        .mockReturnValue(mockRefreshToken);
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockRefreshToken);

      const result = await service.generateRefreshToken(
        mockUser,
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(result.token).toBe(mockToken);
      expect(result.expiresIn).toBe(2592000);
      expect(signSpy).toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('validateRefreshToken', () => {
    it('should validate a valid refresh token', async () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        sub: mockUser.id,
        jti: 'jti-123',
        type: 'refresh' as const,
        family: 'family-123',
      };
      const mockRefreshToken = createMockRefreshToken();

      const verifySpy = jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue(mockPayload);
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockRefreshToken);
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockRefreshToken);

      const result = await service.validateRefreshToken(mockToken);

      expect(result).toEqual(mockPayload);
      expect(verifySpy).toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { jti: 'jti-123' },
      });
      expect(saveSpy).toHaveBeenCalled();
      expect(mockRefreshToken.lastUsedAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid token signature', async () => {
      const mockToken = 'invalid.jwt.token';

      const verifySpy = jest
        .spyOn(jwtService, 'verify')
        .mockImplementation(() => {
          throw new JsonWebTokenError('invalid signature');
        });

      await expect(service.validateRefreshToken(mockToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(verifySpy).toHaveBeenCalled();
    });

    it('should throw error if token not found in database', async () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        sub: mockUser.id,
        jti: 'jti-123',
        type: 'refresh' as const,
        family: 'family-123',
      };

      const verifySpy = jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue(mockPayload);
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(null);

      await expect(service.validateRefreshToken(mockToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(verifySpy).toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalled();
    });

    it('should throw error if token is revoked', async () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        sub: mockUser.id,
        jti: 'jti-123',
        type: 'refresh' as const,
        family: 'family-123',
      };
      const mockRefreshToken = createMockRefreshToken({
        isRevoked: true,
      });

      const verifySpy = jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue(mockPayload);
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockRefreshToken);

      await expect(service.validateRefreshToken(mockToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(verifySpy).toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalled();
    });

    it('should throw error if token is expired', async () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        sub: mockUser.id,
        jti: 'jti-123',
        type: 'refresh' as const,
        family: 'family-123',
      };
      const mockRefreshToken = createMockRefreshToken({
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
      });

      const verifySpy = jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue(mockPayload);
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockRefreshToken);

      await expect(service.validateRefreshToken(mockToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(verifySpy).toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalled();
    });

    it('should throw error if user agent does not match', async () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        sub: mockUser.id,
        jti: 'jti-123',
        type: 'refresh' as const,
        family: 'family-123',
      };
      const storedUserAgent = 'Mozilla/5.0 (Windows NT 10.0)';
      const receivedUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)';
      const mockRefreshToken = createMockRefreshToken({
        userAgent: storedUserAgent,
      });

      const verifySpy = jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue(mockPayload);
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockRefreshToken);
      const revokeTokenSpy = jest
        .spyOn(service, 'revokeTokenByJti')
        .mockResolvedValue(undefined);
      const loggerWarnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation();

      await expect(
        service.validateRefreshToken(mockToken, undefined, receivedUserAgent),
      ).rejects.toThrow(UnauthorizedException);

      expect(verifySpy).toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalled();
      expect(revokeTokenSpy).toHaveBeenCalledWith(mockPayload.jti);
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('User agent mismatch'),
      );
    });

    it('should succeed when user agents match', async () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        sub: mockUser.id,
        jti: 'jti-123',
        type: 'refresh' as const,
        family: 'family-123',
      };
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0)';
      const mockRefreshToken = createMockRefreshToken({
        userAgent: userAgent,
      });

      const verifySpy = jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue(mockPayload);
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockRefreshToken);
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockRefreshToken);

      const result = await service.validateRefreshToken(
        mockToken,
        undefined,
        userAgent,
      );

      expect(result).toEqual(mockPayload);
      expect(verifySpy).toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should succeed when no user agent is provided (backward compatibility)', async () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        sub: mockUser.id,
        jti: 'jti-123',
        type: 'refresh' as const,
        family: 'family-123',
      };
      const mockRefreshToken = createMockRefreshToken({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
      });

      const verifySpy = jest
        .spyOn(jwtService, 'verify')
        .mockReturnValue(mockPayload);
      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockRefreshToken);
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockRefreshToken);

      const result = await service.validateRefreshToken(mockToken);

      expect(result).toEqual(mockPayload);
      expect(verifySpy).toHaveBeenCalled();
      expect(findOneSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for TokenExpiredError', async () => {
      const mockToken = 'expired.jwt.token';
      const loggerLogSpy = jest
        .spyOn(service['logger'], 'log')
        .mockImplementation();

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new TokenExpiredError('jwt expired', new Date());
      });

      await expect(service.validateRefreshToken(mockToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateRefreshToken(mockToken)).rejects.toThrow(
        'Refresh token has expired',
      );

      expect(loggerLogSpy).toHaveBeenCalled();
      loggerLogSpy.mockRestore();
    });

    it('should throw UnauthorizedException for JsonWebTokenError', async () => {
      const mockToken = 'invalid.jwt.token';
      const loggerWarnSpy = jest
        .spyOn(service['logger'], 'warn')
        .mockImplementation();

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new JsonWebTokenError('invalid token');
      });

      await expect(service.validateRefreshToken(mockToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateRefreshToken(mockToken)).rejects.toThrow(
        'Invalid refresh token',
      );

      expect(loggerWarnSpy).toHaveBeenCalled();
      loggerWarnSpy.mockRestore();
    });

    it('should throw InternalServerErrorException for database errors', async () => {
      const mockToken = 'valid.jwt.token';
      const mockPayload = {
        sub: mockUser.id,
        jti: 'jti-123',
        type: 'refresh' as const,
        family: 'family-123',
      };
      const loggerErrorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);
      jest.spyOn(repository, 'findOne').mockImplementation(() => {
        throw new QueryFailedError(
          'SELECT * FROM refresh_tokens',
          [],
          new Error('Connection lost'),
        );
      });

      await expect(service.validateRefreshToken(mockToken)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.validateRefreshToken(mockToken)).rejects.toThrow(
        'Token validation failed due to server error',
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database error during token validation'),
        expect.any(String),
      );
      loggerErrorSpy.mockRestore();
    });

    it('should re-throw unexpected errors', async () => {
      const mockToken = 'valid.jwt.token';
      const unexpectedError = new Error('Unexpected system error');
      const loggerErrorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw unexpectedError;
      });

      await expect(service.validateRefreshToken(mockToken)).rejects.toThrow(
        unexpectedError,
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unexpected error during token validation'),
        expect.any(String),
      );
      loggerErrorSpy.mockRestore();
    });
  });

  describe('rotateRefreshToken', () => {
    it('should rotate refresh token successfully', async () => {
      const oldToken = 'old.jwt.token';
      const newToken = 'new.jwt.token';
      const mockPayload = {
        sub: mockUser.id,
        jti: 'old-jti',
        type: 'refresh' as const,
        family: 'family-123',
      };

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);
      jest.spyOn(repository, 'findOne').mockResolvedValue({
        jti: 'old-jti',
        tokenFamily: 'family-123',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
      } as RefreshToken);
      jest
        .spyOn(repository, 'update')
        .mockResolvedValue({ affected: 1 } as UpdateResult);
      jest.spyOn(jwtService, 'sign').mockReturnValue(newToken);
      jest.spyOn(repository, 'create').mockReturnValue({} as RefreshToken);
      jest.spyOn(repository, 'save').mockResolvedValue({} as RefreshToken);

      const result = await service.rotateRefreshToken(
        oldToken,
        mockUser,
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(result.token).toBe(newToken);
    });
  });

  describe('revokeTokenByJti', () => {
    it('should revoke token by JTI', async () => {
      const mockToken = createMockRefreshToken();

      const findOneSpy = jest
        .spyOn(repository, 'findOne')
        .mockResolvedValue(mockToken);
      const saveSpy = jest
        .spyOn(repository, 'save')
        .mockResolvedValue(mockToken);

      await service.revokeTokenByJti('jti-123');

      expect(findOneSpy).toHaveBeenCalledWith({ where: { jti: 'jti-123' } });
      expect(saveSpy).toHaveBeenCalled();
      expect(mockToken.isRevoked).toBe(true);
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      const updateSpy = jest
        .spyOn(repository, 'update')
        .mockResolvedValue({ affected: 5 } as UpdateResult);

      await service.revokeAllUserTokens(mockUser.id);

      expect(updateSpy).toHaveBeenCalledWith(
        { userId: mockUser.id, isRevoked: false },
        { isRevoked: true },
      );
    });
  });

  describe('getUserSessions', () => {
    it('should return paginated sessions for a user', async () => {
      const mockSessions = [
        createMockRefreshToken({
          id: 'session-1',
          jti: 'jti-1',
          tokenFamily: 'family-1',
        }),
      ];

      const findAndCountSpy = jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mockSessions, 1]);

      const result = await service.getUserSessions(mockUser.id);

      expect(result).toEqual({
        data: mockSessions,
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(findAndCountSpy).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          isRevoked: false,
        },
        order: {
          createdAt: 'DESC',
        },
        skip: 0,
        take: 10,
      });
    });

    it('should support pagination, filtering, and ordering', async () => {
      const mockSessions = [
        createMockRefreshToken({
          id: 'session-1',
          jti: 'jti-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          tokenFamily: 'family-1',
        }),
      ];

      const findAndCountSpy = jest
        .spyOn(repository, 'findAndCount')
        .mockResolvedValue([mockSessions, 1]);

      const result = await service.getUserSessions(
        mockUser.id,
        { page: 2, limit: 5 },
        { ipAddress: '192.168', userAgent: 'Mozilla' },
        { order: ['lastUsedAt:desc'] },
      );

      expect(result).toEqual({
        data: mockSessions,
        total: 1,
        page: 2,
        limit: 5,
      });
      expect(findAndCountSpy).toHaveBeenCalled();
    });
  });
});
