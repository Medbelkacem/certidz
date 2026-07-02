import {
  Injectable,
  Logger,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { Env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';

export interface IndicatorResult {
  status: 'up' | 'down';
  latencyMs?: number;
  error?: string;
}

export interface ReadinessReport {
  status: 'ok' | 'degraded';
  info: Record<string, IndicatorResult>;
  uptimeSeconds: number;
  timestamp: string;
}

/**
 * Hand-rolled health indicators (the project does not depend on
 * @nestjs/terminus). Readiness pings Postgres and Redis; liveness is a cheap
 * in-process check that the event loop is responsive.
 */
@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);
  private redis: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  liveness(): { status: 'ok'; uptimeSeconds: number; timestamp: string } {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  async readiness(): Promise<ReadinessReport> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);
    const info = { database, redis };
    const allUp = Object.values(info).every((i) => i.status === 'up');
    return {
      status: allUp ? 'ok' : 'degraded',
      info,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<IndicatorResult> {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - started };
    } catch (err) {
      this.logger.warn(`DB readiness failed: ${String((err as Error).message)}`);
      return { status: 'down', error: (err as Error).message };
    }
  }

  private async checkRedis(): Promise<IndicatorResult> {
    const started = Date.now();
    try {
      const pong = await this.getRedis().ping();
      return pong === 'PONG'
        ? { status: 'up', latencyMs: Date.now() - started }
        : { status: 'down', error: `unexpected reply: ${pong}` };
    } catch (err) {
      this.logger.warn(
        `Redis readiness failed: ${String((err as Error).message)}`,
      );
      return { status: 'down', error: (err as Error).message };
    }
  }

  private getRedis(): Redis {
    if (!this.redis) {
      this.redis = new Redis({
        host: this.config.get('REDIS_HOST', { infer: true }),
        port: this.config.get('REDIS_PORT', { infer: true }),
        password: this.config.get('REDIS_PASSWORD', { infer: true }),
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.redis.on('error', (err) =>
        this.logger.debug(`redis health client error: ${err.message}`),
      );
    }
    return this.redis;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      this.redis.disconnect();
      this.redis = null;
    }
  }
}
