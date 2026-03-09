import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity, JobStatus } from '@/modules/jobs/entities/job.entity';
import { CreateJobDto } from '@/modules/jobs/dto/create-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('jobs')
    private readonly jobsQueue: Queue,
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>
  ) {}

  async create(dto: CreateJobDto): Promise<JobEntity> {
    const job = this.jobRepository.create({
      type: dto.type,
      prompt: dto.prompt,
      status: JobStatus.PENDING,
      priority: dto.priority ?? 0,
      maxRetries: dto.maxRetries ?? 3,
    });
    const saved = await this.jobRepository.save(job);
    await this.jobsQueue.add(dto.type, {
      jobId: saved.id,
      prompt: dto.prompt,
    });
    return saved;
  }

  async findOne(id: string): Promise<JobEntity | null> {
    return this.jobRepository.findOne({ where: { id } });
  }
}
