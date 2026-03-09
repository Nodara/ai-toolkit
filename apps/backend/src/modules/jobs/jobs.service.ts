import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { JobEntity, JobStatus } from '@/modules/jobs/entities/job.entity';
import { CreateJobDto } from '@/modules/jobs/dto/create-job.dto';
import { JobResponseDto } from '@/modules/jobs/dto/job-response.dto';
import { JobFilterDto } from '@/modules/jobs/dto/job-filter.dto';

export interface PaginatedJobs {
  data: JobResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('generation')
    private readonly generationQueue: Queue,
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>
  ) {}

  async createJob(dto: CreateJobDto): Promise<JobResponseDto> {
    const job = this.jobRepository.create({
      type: dto.type,
      prompt: dto.prompt,
      status: JobStatus.PENDING,
      priority: dto.priority ?? 0,
    });
    const saved = await this.jobRepository.save(job);
    await this.generationQueue.add(
      'generate',
      { jobId: saved.id },
      { priority: saved.priority }
    );
    return this.toResponseDto(saved);
  }

  async findAll(filter: JobFilterDto): Promise<PaginatedJobs> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.jobRepository
      .createQueryBuilder('job')
      .orderBy('job.createdAt', 'DESC');

    if (filter.type !== undefined) {
      qb.andWhere('job.type = :type', { type: filter.type });
    }
    if (filter.status !== undefined) {
      qb.andWhere('job.status = :status', { status: filter.status });
    }

    const [entities, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data: entities.map((e) => this.toResponseDto(e)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<JobResponseDto> {
    const entity = await this.jobRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Job with id ${id} not found`);
    }
    return this.toResponseDto(entity);
  }

  async cancelJob(id: string): Promise<JobResponseDto> {
    const entity = await this.jobRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Job with id ${id} not found`);
    }
    if (
      entity.status === JobStatus.COMPLETED ||
      entity.status === JobStatus.FAILED
    ) {
      throw new ConflictException(
        `Cannot cancel job in ${entity.status} status`
      );
    }

    const waitingJobs = await this.generationQueue.getWaiting();
    const bullJob = waitingJobs.find((j) => j.data.jobId === id);
    if (bullJob) {
      await bullJob.remove();
    }

    await this.jobRepository.update(id, { status: JobStatus.CANCELLED });
    const updated = await this.jobRepository.findOneOrFail({ where: { id } });
    return this.toResponseDto(updated);
  }

  async retryJob(id: string): Promise<JobResponseDto> {
    const entity = await this.jobRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Job with id ${id} not found`);
    }
    if (
      entity.status !== JobStatus.FAILED &&
      entity.status !== JobStatus.CANCELLED
    ) {
      throw new ConflictException(
        `Can only retry failed or cancelled jobs, got ${entity.status}`
      );
    }

    const retryCount = entity.retryCount + 1;
    await this.jobRepository.update(id, {
      status: JobStatus.PENDING,
      retryCount,
      errorMessage: null,
    });

    await this.generationQueue.add(
      'generate',
      { jobId: id },
      { priority: entity.priority }
    );

    const updated = await this.jobRepository.findOneOrFail({ where: { id } });
    return this.toResponseDto(updated);
  }

  private toResponseDto(entity: JobEntity): JobResponseDto {
    return plainToInstance(JobResponseDto, instanceToPlain(entity), {
      excludeExtraneousValues: true,
    });
  }
}
