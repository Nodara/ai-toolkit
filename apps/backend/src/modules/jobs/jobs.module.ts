import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from '@/modules/jobs/jobs.controller';
import { JobsService } from '@/modules/jobs/jobs.service';
import { JobsProcessor } from '@/modules/jobs/jobs.processor';
import { JobEntity } from '@/modules/jobs/entities/job.entity';
import { QueueModule } from '@/modules/queue/queue.module';
import { GenerationModule } from '@/modules/generation/generation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity]),
    QueueModule,
    GenerationModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsProcessor],
})
export class JobsModule {}
