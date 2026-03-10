import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AppConfigModule } from '@/config';
import { DatabaseModule } from '@/database/database.module';
import { QueueModule } from '@/modules/queue/queue.module';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { GenerationModule } from '@/modules/generation/generation.module';
import { SseModule } from '@/modules/sse/sse.module';
import { HealthModule } from '@/modules/health/health.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    QueueModule,
    JobsModule,
    GenerationModule,
    SseModule,
    HealthModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
