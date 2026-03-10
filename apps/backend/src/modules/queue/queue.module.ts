import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from '@/config';
import { QueueService } from '@/modules/queue/queue.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (appConfig: AppConfigService) => {
        const url = appConfig.redisUrl;
        if (url) {
          return { connection: { url } };
        }
        return {
          connection: {
            host: appConfig.redisHost,
            port: appConfig.redisPort,
          },
        };
      },
      inject: [AppConfigService],
    }),
    BullModule.registerQueue({
      name: 'generation',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  providers: [QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
