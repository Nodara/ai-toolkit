import { NestFactory, Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
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
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
