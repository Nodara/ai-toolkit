import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JobType, JobStatus } from '@/modules/jobs/entities/job.entity';

export class JobFilterDto {
  @IsEnum(JobType)
  @IsOptional()
  type?: JobType;

  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
