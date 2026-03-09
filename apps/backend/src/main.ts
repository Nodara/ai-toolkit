import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  await dataSource.runMigrations();
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
