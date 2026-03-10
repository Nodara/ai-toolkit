import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity, JobStatus } from '@/modules/jobs/entities/job.entity';
import { GenerationService } from '@/modules/generation/generation.service';
import { SseService } from '@/modules/sse/sse.service';
import { JobsService } from '@/modules/jobs/jobs.service';

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
    private readonly sseService: SseService,
    private readonly jobsService: JobsService
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
      const generatingEntity = await this.jobRepository.findOneOrFail({
        where: { id: jobId },
      });
      this.sseService.broadcast({
        type: 'job:updated',
        payload: this.jobsService.toResponseDto(generatingEntity),
      });

      const result = await this.runWithTimeout(
        () => this.generationService.generate(entity),
        this.JOB_TIMEOUT_MS
      );

      const updatePayload: Partial<JobEntity> = {
        status: JobStatus.COMPLETED,
        resultUrl: result.resultUrl ?? null,
        resultText: result.resultText ?? null,
      };
      await this.jobRepository.update(jobId, updatePayload);
      const completedEntity = await this.jobRepository.findOneOrFail({
        where: { id: jobId },
      });
      this.sseService.broadcast({
        type: 'job:completed',
        payload: this.jobsService.toResponseDto(completedEntity),
      });
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      await this.jobRepository.update(jobId, {
        status: JobStatus.FAILED,
        errorMessage,
      });
      const failedEntity = await this.jobRepository.findOneOrFail({
        where: { id: jobId },
      });
      this.sseService.broadcast({
        type: 'job:failed',
        payload: this.jobsService.toResponseDto(failedEntity),
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
        return 'Generation timed out after 30s';
      }
      return error.message;
    }
    return String(error);
  }
}
