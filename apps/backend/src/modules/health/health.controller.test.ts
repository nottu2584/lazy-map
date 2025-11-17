import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthController } from './health.controller';
import { HealthCheckUseCase } from '@lazy-map/application';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckUseCase: HealthCheckUseCase;

  beforeEach(async () => {
    const mockHealthCheckUseCase = {
      execute: vi.fn().mockReturnValue({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 1000,
        version: '1.0.0'
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckUseCase,
          useValue: mockHealthCheckUseCase
        }
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckUseCase = module.get(HealthCheckUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have health check methods', () => {
    expect(controller.getHealth).toBeDefined();
    expect(typeof controller.getHealth).toBe('function');
    expect(controller.getLiveness).toBeDefined();
    expect(typeof controller.getLiveness).toBe('function');
    expect(controller.getReadiness).toBeDefined();
    expect(typeof controller.getReadiness).toBe('function');
  });

  it('should return health status', () => {
    const result = controller.getHealth();
    expect(result.status).toBe('healthy');
    expect(healthCheckUseCase.execute).toHaveBeenCalled();
  });

  it('should return liveness status', () => {
    const result = controller.getLiveness();
    expect(result.status).toBe('alive');
  });

  it('should return readiness status', () => {
    const result = controller.getReadiness();
    expect(result.ready).toBe(true);
    expect(result.timestamp).toBeDefined();
  });
});