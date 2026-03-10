import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { AppConfigService } from '@/config';

export interface HealthResult {
  status: 'ok' | 'degraded';
  timestamp: string;
  services: {
    database: { status: 'up' | 'down'; latencyMs: number };
    redis: { status: 'up' | 'down' };
  };
}

@Injectable()
export class HealthService {
  async check(): Promise<HealthResult> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const allUp = database.status === 'up' && redis.status === 'up';
    const status = allUp ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      services: { database, redis },
    };
  }

  private async checkDatabase(): Promise<{
    status: 'up' | 'down';
    latencyMs: number;
  }> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up', latencyMs: Date.now() - start };
    } catch {
      return { status: 'down', latencyMs: Date.now() - start };
    }
  }

  private async checkRedis(): Promise<{ status: 'up' | 'down' }> {
    const url = this.appConfig.redisUrl;
    const host = this.appConfig.redisHost;
    const port = this.appConfig.redisPort;

    let redis: Redis | null = null;
    try {
      redis = url ? new Redis(url) : new Redis({ host, port });
      await redis.ping();
      return { status: 'up' };
    } catch {
      return { status: 'down' };
    } finally {
      redis?.disconnect();
    }
  }

  constructor(
    private readonly dataSource: DataSource,
    private readonly appConfig: AppConfigService
  ) {}
}
