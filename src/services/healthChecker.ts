import axios from 'axios';
import { ServiceConfig } from '../types';
import { getAllServices } from './serviceRegistry';
import { logger } from './logger';

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  lastCheck: string;
}

export class HealthChecker {
  private healthCache: Map<string, HealthStatus> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(private intervalMs: number = 30000) {
    this.startHealthChecks();
  }

  private startHealthChecks(): void {
    this.checkInterval = setInterval(() => {
      this.checkAllServices();
    }, this.intervalMs);

    // Initial check
    this.checkAllServices();
  }

  public stopHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkAllServices(): Promise<void> {
    const services = getAllServices();
    
    const healthChecks = services.map(service => 
      this.checkServiceHealth(service)
    );

    await Promise.allSettled(healthChecks);
  }

  private async checkServiceHealth(service: ServiceConfig): Promise<void> {
    const startTime = Date.now();
    
    try {
      const healthUrl = `${service.baseUrl}${service.healthCheck || '/health'}`;
      
      const response = await axios.get(healthUrl, {
        timeout: 5000,
        validateStatus: (status) => status < 500
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status >= 200 && response.status < 300;

      const healthStatus: HealthStatus = {
        service: service.name,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        lastCheck: new Date().toISOString(),
        ...(isHealthy ? {} : { error: `HTTP ${response.status}` })
      };

      this.healthCache.set(service.name, healthStatus);

      logger.info(`Health check for ${service.name}`, {
        status: healthStatus.status,
        responseTime,
        url: healthUrl
      });

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      const healthStatus: HealthStatus = {
        service: service.name,
        status: 'unhealthy',
        responseTime,
        error: error.message || 'Unknown error',
        lastCheck: new Date().toISOString()
      };

      this.healthCache.set(service.name, healthStatus);

      logger.error(`Health check failed for ${service.name}`, {
        error: error.message,
        responseTime,
        url: `${service.baseUrl}${service.healthCheck || '/health'}`
      });
    }
  }

  public getServiceHealth(serviceName: string): HealthStatus | null {
    return this.healthCache.get(serviceName) || null;
  }

  public getAllHealthStatuses(): HealthStatus[] {
    return Array.from(this.healthCache.values());
  }

  public getOverallHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthStatus[];
    summary: {
      total: number;
      healthy: number;
      unhealthy: number;
    };
  } {
    const services = this.getAllHealthStatuses();
    const healthy = services.filter(s => s.status === 'healthy').length;
    const unhealthy = services.filter(s => s.status === 'unhealthy').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (unhealthy === services.length) {
      overallStatus = 'unhealthy';
    } else if (unhealthy > 0) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      services,
      summary: {
        total: services.length,
        healthy,
        unhealthy
      }
    };
  }
}

// Global health checker instance
export const healthChecker = new HealthChecker();

// Graceful shutdown
process.on('SIGTERM', () => {
  healthChecker.stopHealthChecks();
});

process.on('SIGINT', () => {
  healthChecker.stopHealthChecks();
});
