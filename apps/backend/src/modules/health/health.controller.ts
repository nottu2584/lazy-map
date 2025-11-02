import { HealthCheckResult, HealthCheckUseCase } from '@lazy-map/application';
import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Health Controller for API health monitoring
 * Following Clean Architecture: Controller → Use Case → Domain
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject('HealthCheckUseCase')
    private readonly healthCheckUseCase: HealthCheckUseCase
  ) {}

  /**
   * Basic health check endpoint
   * Returns the overall health status of the application
   */
  @Get()
  @ApiOperation({ summary: 'Check application health status' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', description: 'Uptime in seconds' },
        version: { type: 'string' }
      }
    }
  })
  getHealth(): HealthCheckResult {
    return this.healthCheckUseCase.execute();
  }

  /**
   * Liveness probe for Kubernetes/container orchestration
   * Returns 200 if the application is alive
   */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  getLiveness(): { status: string } {
    return { status: 'alive' };
  }

  /**
   * Readiness probe for Kubernetes/container orchestration
   * Returns 200 if the application is ready to accept traffic
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  getReadiness(): { ready: boolean; timestamp: string } {
    const healthCheck = this.healthCheckUseCase.execute();
    return {
      ready: healthCheck.status !== 'unhealthy',
      timestamp: healthCheck.timestamp
    };
  }
}