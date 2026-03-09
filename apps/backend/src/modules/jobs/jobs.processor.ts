import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  JobEntity,
  JobStatus,
  JobType,
} from '@/modules/jobs/entities/job.entity';
import { GenerationService } from '@/modules/generation/generation.service';

@Processor('jobs')
@Injectable()
export class JobsProcessor extends WorkerHost {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>,
    private readonly generationService: GenerationService
  ) {
    super();
  }

  async process(job: Job<{ jobId: string; prompt: string }>): Promise<void> {
    const { jobId, prompt } = job.data;

    const entity = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!entity) return;

    try {
      await this.jobRepository.update(jobId, { status: JobStatus.GENERATING });

      const result = await this.generationService.generate({
        type: entity.type,
        prompt,
      });

      const updatePayload: Partial<JobEntity> = {
        status: JobStatus.COMPLETED,
      };
      if (entity.type === JobType.IMAGE && result.startsWith('http')) {
        updatePayload.resultUrl = result;
      } else {
        updatePayload.resultText = result;
      }
      await this.jobRepository.update(jobId, updatePayload);
    } catch (error) {
      await this.jobRepository.update(jobId, {
        status: JobStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
