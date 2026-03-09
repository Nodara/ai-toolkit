import { JobType } from '@/modules/jobs/entities/job.entity';

export class CreateJobDto {
  type!: JobType;
  prompt!: string;
  priority?: number;
  maxRetries?: number;
}
