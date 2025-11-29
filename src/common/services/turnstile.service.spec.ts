import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { TurnstileService } from './turnstile.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('TurnstileService', () => {
  let service: TurnstileService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'turnstile.secretKey') {
        return 'test-secret-key';
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnstileService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TurnstileService>(TurnstileService);
    configService = module.get<ConfigService>(ConfigService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyToken', () => {
    const mockToken = 'test-turnstile-token';
    const mockIp = '192.168.1.1';
    const mockSecretKey = 'test-secret-key';

    beforeEach(() => {
      jest.spyOn(configService, 'get').mockReturnValue(mockSecretKey);
    });

    it('should verify token successfully', async () => {
      const mockResponse = {
        success: true,
        challenge_ts: '2024-01-01T00:00:00.000Z',
        hostname: 'example.com',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.verifyToken(mockToken, mockIp);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );
    });

    it('should verify token without IP address', async () => {
      const mockResponse = {
        success: true,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.verifyToken(mockToken);

      expect(result).toBe(true);
    });

    it('should return false for failed verification', async () => {
      const mockResponse = {
        success: false,
        'error-codes': ['invalid-input-response'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const logSpy = jest.spyOn(Logger.prototype, 'warn');

      const result = await service.verifyToken(mockToken, mockIp);

      expect(result).toBe(false);
      expect(logSpy).toHaveBeenCalled();
    });

    it('should throw error if secret key not configured', async () => {
      // Create a new service with null secret key
      const nullConfigService = {
        get: jest.fn().mockReturnValue(null),
      };
      const module = await Test.createTestingModule({
        providers: [
          TurnstileService,
          {
            provide: ConfigService,
            useValue: nullConfigService,
          },
        ],
      }).compile();

      const serviceWithNullKey = module.get<TurnstileService>(TurnstileService);

      await expect(
        serviceWithNullKey.verifyToken(mockToken, mockIp),
      ).rejects.toThrow('Turnstile verification is not configured');
    });

    it('should throw error if API returns non-ok status', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(service.verifyToken(mockToken, mockIp)).rejects.toThrow(
        'Failed to verify Turnstile token',
      );

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network failure');
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      const errorSpy = jest.spyOn(Logger.prototype, 'error');

      await expect(service.verifyToken(mockToken, mockIp)).rejects.toThrow(
        'Network failure',
      );

      expect(errorSpy).toHaveBeenCalledWith(
        'Turnstile verification error: Network failure',
        networkError.stack,
      );
    });
  });
});
