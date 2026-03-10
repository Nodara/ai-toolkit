import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV') ?? 'development';
  }

  get port(): number {
    return this.config.get<number>('PORT') ?? 3001;
  }

  get databaseUrl(): string {
    const url = this.config.get<string>('DATABASE_URL');
    if (!url) throw new Error('DATABASE_URL is required');
    return url;
  }

  get redisUrl(): string | undefined {
    return this.config.get<string>('REDIS_URL');
  }

  get redisHost(): string {
    return this.config.get<string>('REDIS_HOST') ?? 'localhost';
  }

  get redisPort(): number {
    return this.config.get<number>('REDIS_PORT') ?? 6379;
  }

  get corsOrigin(): string {
    return this.config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';
  }

  get jwtSecret(): string | undefined {
    return this.config.get<string>('JWT_SECRET');
  }
}
