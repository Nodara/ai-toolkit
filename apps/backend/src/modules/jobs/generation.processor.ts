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
import { SseService } from '@/modules/sse/sse.service';

export interface GenerationJobData {
  jobId: string;
}

@Processor('generation')
@Injectable()
export class GenerationProcessor extends WorkerHost {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>,
    private readonly generationService: GenerationService,
    private readonly sseService: SseService
  ) {
    super();
  }

  private readonly JOB_TIMEOUT_MS = 30000;

  async process(job: Job<GenerationJobData>): Promise<void> {
    const { jobId } = job.data;

    const entity = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!entity) return;
    if (entity.status === JobStatus.CANCELLED) return;

    try {
      await this.jobRepository.update(jobId, { status: JobStatus.GENERATING });
      this.sseService.emit({
        type: 'job:status',
        data: { jobId, status: JobStatus.GENERATING },
      });

      const result = await this.runWithTimeout(
        () => this.generationService.generate(entity),
        this.JOB_TIMEOUT_MS
      );

      const updatePayload: Partial<JobEntity> = {
        status: JobStatus.COMPLETED,
      };
      if (entity.type === JobType.IMAGE && result.startsWith('http')) {
        updatePayload.resultUrl = result;
      } else {
        updatePayload.resultText = result;
      }
      await this.jobRepository.update(jobId, updatePayload);
      this.sseService.emit({
        type: 'job:completed',
        data: { jobId, status: JobStatus.COMPLETED, result },
      });
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      await this.jobRepository.update(jobId, {
        status: JobStatus.FAILED,
        errorMessage,
      });
      this.sseService.emit({
        type: 'job:failed',
        data: { jobId, status: JobStatus.FAILED, errorMessage },
      });
      throw error;
    }
  }

  private async runWithTimeout<T>(
    fn: () => Promise<T>,
    ms: number
  ): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('Job timed out after 30 seconds')),
        ms
      );
    });
    try {
      const result = await Promise.race([fn(), timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);
      return result;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      throw err;
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      const name = error.name?.toLowerCase() ?? '';
      const message = error.message?.toLowerCase() ?? '';
      if (
        name.includes('timeout') ||
        name === 'aborterror' ||
        message.includes('timeout') ||
        message.includes('timed out')
      ) {
        return 'Job timed out after 30 seconds';
      }
      return error.message;
    }
    return String(error);
  }
}
