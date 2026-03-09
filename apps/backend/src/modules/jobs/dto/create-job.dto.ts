import {
  IsString,
  IsEnum,
  IsBoolean,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { JobType } from '@/modules/jobs/entities/job.entity';

export class CreateJobDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  prompt!: string;

  @IsEnum(JobType)
  type!: JobType;

  @IsBoolean()
  @IsOptional()
  enhancePrompt?: boolean = false;

  @IsInt()
  @Min(0)
  @Max(5)
  @IsOptional()
  priority?: number;
}
