import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { TurnstileGuard } from './turnstile.guard';
import { TurnstileService } from '../services/turnstile.service';

describe('TurnstileGuard', () => {
  let guard: TurnstileGuard;
  let turnstileService: TurnstileService;

  const mockTurnstileService = {
    verifyToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnstileGuard,
        {
          provide: TurnstileService,
          useValue: mockTurnstileService,
        },
      ],
    }).compile();

    guard = module.get<TurnstileGuard>(TurnstileGuard);
    turnstileService = module.get<TurnstileService>(TurnstileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (
    body: { turnstileToken?: string; [key: string]: unknown },
    ip?: string,
    headers?: Record<string, string | string[] | undefined>,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          body,
          ip,
          headers: headers || {},
          socket: { remoteAddress: '127.0.0.1' },
        }),
      }),
    } as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request with valid turnstile token', async () => {
    const mockToken = 'valid-token';
    const mockContext = createMockExecutionContext(
      { turnstileToken: mockToken },
      '192.168.1.1',
    );

    const verifySpy = jest
      .spyOn(turnstileService, 'verifyToken')
      .mockResolvedValue(true);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(verifySpy).toHaveBeenCalledWith(mockToken, '192.168.1.1');
  });

  it('should throw UnauthorizedException if token is missing', async () => {
    const mockContext = createMockExecutionContext({});

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      new UnauthorizedException('Turnstile token is required'),
    );
  });

  it('should throw UnauthorizedException if token is invalid', async () => {
    const mockToken = 'invalid-token';
    const mockContext = createMockExecutionContext({
      turnstileToken: mockToken,
    });

    const verifySpy = jest
      .spyOn(turnstileService, 'verifyToken')
      .mockResolvedValue(false);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      new UnauthorizedException('Invalid captcha verification'),
    );

    expect(verifySpy).toHaveBeenCalled();
  });

  it('should extract IP from x-forwarded-for header', async () => {
    const mockToken = 'valid-token';
    const mockContext = createMockExecutionContext(
      { turnstileToken: mockToken },
      undefined,
      { 'x-forwarded-for': '10.0.0.1, 192.168.1.1' },
    );

    const verifySpy = jest
      .spyOn(turnstileService, 'verifyToken')
      .mockResolvedValue(true);

    await guard.canActivate(mockContext);

    expect(verifySpy).toHaveBeenCalledWith(mockToken, '10.0.0.1');
  });

  it('should use socket.remoteAddress as fallback', async () => {
    const mockToken = 'valid-token';
    const mockContext = createMockExecutionContext({
      turnstileToken: mockToken,
    });

    const verifySpy = jest
      .spyOn(turnstileService, 'verifyToken')
      .mockResolvedValue(true);

    await guard.canActivate(mockContext);

    expect(verifySpy).toHaveBeenCalledWith(mockToken, '127.0.0.1');
  });

  it('should throw UnauthorizedException on service error', async () => {
    const mockToken = 'valid-token';
    const mockContext = createMockExecutionContext({
      turnstileToken: mockToken,
    });

    const verifySpy = jest
      .spyOn(turnstileService, 'verifyToken')
      .mockRejectedValue(new Error('Service error'));

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      new UnauthorizedException('Captcha verification failed'),
    );

    expect(verifySpy).toHaveBeenCalled();
  });

  it('should preserve UnauthorizedException from service', async () => {
    const mockToken = 'valid-token';
    const mockContext = createMockExecutionContext({
      turnstileToken: mockToken,
    });

    const customException = new UnauthorizedException('Custom error');
    const verifySpy = jest
      .spyOn(turnstileService, 'verifyToken')
      .mockRejectedValue(customException);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      customException,
    );

    expect(verifySpy).toHaveBeenCalled();
  });
});
