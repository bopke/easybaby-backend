import { Test, TestingModule } from '@nestjs/testing';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { RefreshTokenService } from './refresh-token.service';
import { Logger } from '@nestjs/common';

describe('ScheduledTasksService', () => {
  let service: ScheduledTasksService;
  let refreshTokenService: RefreshTokenService;

  const mockRefreshTokenService = {
    cleanupExpiredTokens: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledTasksService,
        {
          provide: RefreshTokenService,
          useValue: mockRefreshTokenService,
        },
      ],
    }).compile();

    service = module.get<ScheduledTasksService>(ScheduledTasksService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('cleanupExpiredTokens', () => {
    it('should call refreshTokenService.cleanupExpiredTokens and log success', async () => {
      const cleanupSpy = jest
        .spyOn(refreshTokenService, 'cleanupExpiredTokens')
        .mockResolvedValue(5);
      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await service.cleanupExpiredTokens();

      expect(cleanupSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        'Starting scheduled cleanup of expired refresh tokens',
      );
      expect(logSpy).toHaveBeenCalledWith(
        'Scheduled cleanup completed. Removed 5 expired tokens',
      );
    });

    it('should handle errors and log them', async () => {
      const error = new Error('Database connection failed');
      const cleanupSpy = jest
        .spyOn(refreshTokenService, 'cleanupExpiredTokens')
        .mockRejectedValue(error);
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await service.cleanupExpiredTokens();

      expect(cleanupSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to cleanup expired tokens: Database connection failed',
        error.stack,
      );
    });

    it('should handle non-Error exceptions', async () => {
      const cleanupSpy = jest
        .spyOn(refreshTokenService, 'cleanupExpiredTokens')
        .mockRejectedValue('Unknown error');
      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await service.cleanupExpiredTokens();

      expect(cleanupSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to cleanup expired tokens: Unknown error',
        undefined,
      );
    });
  });
});
