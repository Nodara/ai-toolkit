import { NestFactory, Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import { AppModule } from '@/app.module';
import { GlobalExceptionFilter } from '@/common/filters';
import { AppConfigService } from '@/config';

const logger = new Logger('Bootstrap');
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

function isConnectionError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('connect') ||
      msg.includes('connection') ||
      msg.includes('econnrefused') ||
      msg.includes('econnreset') ||
      msg.includes('timeout') ||
      msg.includes('connection refused')
    );
  }
  return false;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfigService);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableCors({
    origin: appConfig.corsOrigin,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();
  await app.listen(appConfig.port);
}

async function bootstrapWithRetry(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await bootstrap();
      return;
    } catch (err) {
      if (isConnectionError(err) && attempt < MAX_RETRIES) {
        logger.warn(
          `Database connection failed (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY_MS / 1000}s...`
        );
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        if (attempt >= MAX_RETRIES && isConnectionError(err)) {
          logger.error(
            `Database connection failed after ${MAX_RETRIES} attempts. Giving up.`
          );
        }
        throw err;
      }
    }
  }
}

bootstrapWithRetry();
