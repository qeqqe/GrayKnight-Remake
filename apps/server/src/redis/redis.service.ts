import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private client: RedisClientType;
  private readonly ttl: number;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {
    this.ttl = this.configService.get<number>('REDIS_CACHE_TTL') || 300;
    this.client = createClient({
      username: this.configService.get<string>('REDIS_USERNAME'),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      socket: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: this.configService.get<number>('REDIS_PORT'),
      },
    });

    this.client.on('error', (err) =>
      this.logger.error('Redis Client Error', err),
    );
    this.client
      .connect()
      .catch((err) => this.logger.error('Redis Connection Error', err));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  private generateStatsKey(userId: string, statsType: string): string {
    return `spotify:stats:${userId}:${statsType}`;
  }

  async getCachedStats<T>(
    userId: string,
    statsType: string,
  ): Promise<T | null> {
    try {
      const key = this.generateStatsKey(userId, statsType);
      const data = await this.client.get(key);
      this.logger.debug(`Cache ${data ? 'hit' : 'miss'} for key: ${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Error getting cached stats: ${error.message}`);
      return null;
    }
  }

  async cacheStats(
    userId: string,
    statsType: string,
    data: any,
  ): Promise<void> {
    try {
      const key = this.generateStatsKey(userId, statsType);
      await this.client.setEx(key, this.ttl, JSON.stringify(data));
      this.logger.debug(`Cached stats for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error caching stats: ${error.message}`);
    }
  }

  async invalidateUserStats(userId: string): Promise<void> {
    try {
      const pattern = this.generateStatsKey(userId, '*');
      const keys = await this.client.keys(pattern);
      if (keys.length) {
        await this.client.del(keys);
        this.logger.debug(
          `Invalidated ${keys.length} cache entries for user ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error invalidating stats cache: ${error.message}`);
    }
  }
}
