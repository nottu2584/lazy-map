/**
 * Health check result interface following Clean Architecture principles
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    memory: {
      status: 'ok' | 'warning' | 'critical';
      usage: number;
      limit: number;
    };
    environment: {
      status: 'ok' | 'error';
      nodeVersion: string;
      environment: string;
    };
  };
  metadata: {
    service: string;
    description: string;
  };
}

/**
 * Use case for checking application health status
 * Following Clean Architecture principles - this is an application layer use case
 */
export class HealthCheckUseCase {
  constructor() {}

  execute(): HealthCheckResult {
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
    const memoryLimitMB = memoryUsage.heapTotal / 1024 / 1024;

    // More reasonable memory thresholds (in MB)
    // Critical: > 1GB, Warning: > 500MB
    const memoryStatus = memoryUsageMB > 1024 ? 'critical' :
                        memoryUsageMB > 512 ? 'warning' : 'ok';

    // Use process.uptime() for accurate uptime in seconds
    const uptimeSeconds = Math.floor(process.uptime());

    // Determine overall health status
    const overallStatus = memoryStatus === 'critical' ? 'unhealthy' :
                         memoryStatus === 'warning' ? 'degraded' : 'healthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: uptimeSeconds,
      version: process.env.APP_VERSION || '1.0.0',
      checks: {
        memory: {
          status: memoryStatus,
          usage: Math.round(memoryUsageMB), // MB
          limit: Math.round(memoryLimitMB)  // MB
        },
        environment: {
          status: 'ok',
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development'
        }
      },
      metadata: {
        service: 'lazy-map-api',
        description: 'Graphical battlemap generator for tabletop games'
      }
    };
  }
}

/**
 * Command for health check (optional, for command pattern if needed)
 */
export class HealthCheckCommand {
  constructor() {}
}