import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let dbHealthIndicator: TypeOrmHealthIndicator;
  let healthCheckSpy: jest.SpyInstance;
  let pingCheckSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn(),
          },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    dbHealthIndicator = module.get<TypeOrmHealthIndicator>(
      TypeOrmHealthIndicator,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should call health check with database indicator', async () => {
      const mockHealthCheckResult: HealthCheckResult = {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      };

      healthCheckSpy = jest
        .spyOn(healthCheckService, 'check')
        .mockResolvedValue(mockHealthCheckResult);

      const result = await controller.check();

      expect(healthCheckSpy).toHaveBeenCalledTimes(1);
      expect(healthCheckSpy).toHaveBeenCalledWith([expect.any(Function)]);
      expect(result).toEqual(mockHealthCheckResult);
    });

    it('should include database ping check', async () => {
      const mockHealthCheckResult: HealthCheckResult = {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      };

      const mockIndicatorResult: HealthIndicatorResult = {
        database: { status: 'up' },
      };

      pingCheckSpy = jest
        .spyOn(dbHealthIndicator, 'pingCheck')
        .mockReturnValue(Promise.resolve(mockIndicatorResult));

      healthCheckSpy = jest
        .spyOn(healthCheckService, 'check')
        .mockImplementation(async (indicators) => {
          // Execute the indicator function to verify it calls pingCheck
          const indicator = indicators[0];
          await indicator();
          return mockHealthCheckResult;
        });

      await controller.check();

      expect(pingCheckSpy).toHaveBeenCalledWith('database');
    });
  });
});
