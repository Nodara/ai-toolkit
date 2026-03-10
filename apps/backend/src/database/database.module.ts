import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule, AppConfigService } from '@/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (appConfig: AppConfigService) => ({
        type: 'postgres' as const,
        url: appConfig.databaseUrl,
        autoLoadEntities: true,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false,
      }),
      inject: [AppConfigService],
    }),
  ],
})
export class DatabaseModule {}
