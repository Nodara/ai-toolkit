import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from '@/modules/jobs/jobs.controller';
import { JobsService } from '@/modules/jobs/jobs.service';
import { GenerationProcessor } from '@/modules/jobs/generation.processor';
import { JobEntity } from '@/modules/jobs/entities/job.entity';
import { QueueModule } from '@/modules/queue/queue.module';
import { GenerationModule } from '@/modules/generation/generation.module';
import { SseModule } from '@/modules/sse/sse.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity]),
    QueueModule,
    GenerationModule,
    SseModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, GenerationProcessor],
})
export class JobsModule {}
