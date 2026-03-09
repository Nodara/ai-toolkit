import { Expose } from 'class-transformer';
import { JobType, JobStatus } from '@/modules/jobs/entities/job.entity';

export class JobResponseDto {
  @Expose()
  id!: string;

  @Expose()
  type!: JobType;

  @Expose()
  status!: JobStatus;

  @Expose()
  prompt!: string;

  @Expose()
  enhancedPrompt!: string | null;

  @Expose()
  resultUrl!: string | null;

  @Expose()
  resultText!: string | null;

  @Expose()
  errorMessage!: string | null;

  @Expose()
  priority!: number;

  @Expose()
  retryCount!: number;

  @Expose()
  maxRetries!: number;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
