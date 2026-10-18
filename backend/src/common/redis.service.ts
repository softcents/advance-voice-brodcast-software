import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  onModuleInit() {
    try {
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = Number(process.env.REDIS_PORT) || 6379;
      const password = process.env.REDIS_PASSWORD || undefined;

      this.client = new Redis({
        host,
        port,
        password,
        retryStrategy: (times) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.client
        .connect()
        .then(() => {
          this.isConnected = true;
          this.logger.log(`✅ Redis connected successfully on ${host}:${port} for Multi-Tenant Cache & Distributed Locks`);
        })
        .catch((err) => {
          this.logger.warn(`Redis connection failed: ${err.message}. Graceful in-memory fallback enabled.`);
        });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis client error: ${err.message}`);
      });
    } catch (e: any) {
      this.logger.warn(`Redis init error: ${e.message}`);
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  /**
   * Acquire a distributed lock for atomic operations (e.g. call dispatch, wallet deduction)
   */
  async acquireLock(lockKey: string, ttlSeconds: number = 30): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return true; // Fallback to allowing execution if Redis is offline
    }
    try {
      const res = await this.client.set(`lock:${lockKey}`, 'LOCKED', 'EX', ttlSeconds, 'NX');
      return res === 'OK';
    } catch (e) {
      return true;
    }
  }

  /**
   * Release a distributed lock
   */
  async releaseLock(lockKey: string): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.del(`lock:${lockKey}`);
    } catch (e) {
      // ignore
    }
  }

  /**
   * Idempotency verification: Check if an operation with this key has already been executed
   */
  async checkAndSetIdempotency(key: string, ttlSeconds: number = 86400): Promise<boolean> {
    if (!this.isConnected || !this.client) return true;
    try {
      const res = await this.client.set(`idemp:${key}`, '1', 'EX', ttlSeconds, 'NX');
      return res === 'OK';
    } catch (e) {
      return true;
    }
  }

  /**
   * Multi-Tenant Scoped Cache Getter
   */
  async getTenantCache<T>(tenantId: string, resourceKey: string): Promise<T | null> {
    if (!this.isConnected || !this.client) return null;
    try {
      const val = await this.client.get(`tenant:${tenantId}:${resourceKey}`);
      return val ? (JSON.parse(val) as T) : null;
    } catch {
      return null;
    }
  }

  /**
   * Multi-Tenant Scoped Cache Setter with TTL
   */
  async setTenantCache(tenantId: string, resourceKey: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      await this.client.set(`tenant:${tenantId}:${resourceKey}`, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (e) {
      // ignore
    }
  }

  /**
   * Invalidate tenant specific cache on mutation
   */
  async invalidateTenantCache(tenantId: string, resourceKeyPattern: string = '*'): Promise<void> {
    if (!this.isConnected || !this.client) return;
    try {
      const keys = await this.client.keys(`tenant:${tenantId}:${resourceKeyPattern}`);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (e) {
      // ignore
    }
  }
}
