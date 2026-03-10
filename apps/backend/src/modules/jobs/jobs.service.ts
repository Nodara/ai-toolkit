import {
  Injectable,
  NotFoundException,
  ConflictException,
  ServiceUnavailableException,
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
import { PromptEnhancementService } from '@/modules/generation/prompt-enhancement.service';
import { SseService } from '@/modules/sse/sse.service';

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
    private readonly jobRepository: Repository<JobEntity>,
    private readonly promptEnhancementService: PromptEnhancementService,
    private readonly sseService: SseService
  ) {}

  async createJob(dto: CreateJobDto): Promise<JobResponseDto> {
    let enhancedPrompt: string | null = null;

    if (dto.enhancePrompt === true) {
      const enhanced = await Promise.race([
        this.promptEnhancementService.enhance(dto.prompt, dto.type),
        new Promise<string>((resolve) =>
          setTimeout(() => resolve(dto.prompt), 2500)
        ),
      ]);
      enhancedPrompt = enhanced !== dto.prompt ? enhanced : null;
    }

    const job = this.jobRepository.create({
      type: dto.type,
      prompt: dto.prompt,
      enhancedPrompt,
      status: JobStatus.PENDING,
      priority: dto.priority ?? 0,
    });
    const saved = await this.jobRepository.save(job);
    this.sseService.broadcast({
      type: 'job:created',
      payload: this.toResponseDto(saved),
    });
    try {
      await this.generationQueue.add(
        'generate',
        { jobId: saved.id },
        { priority: saved.priority }
      );
    } catch {
      throw new ServiceUnavailableException(
        'Job queue is temporarily unavailable. Please try again later.'
      );
    }
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
    this.sseService.broadcast({
      type: 'job:updated',
      payload: this.toResponseDto(updated),
    });
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

    try {
      await this.generationQueue.add(
        'generate',
        { jobId: id },
        { priority: entity.priority }
      );
    } catch {
      throw new ServiceUnavailableException(
        'Job queue is temporarily unavailable. Please try again later.'
      );
    }

    const updated = await this.jobRepository.findOneOrFail({ where: { id } });
    this.sseService.broadcast({
      type: 'job:updated',
      payload: this.toResponseDto(updated),
    });
    return this.toResponseDto(updated);
  }

  async deleteJob(id: string): Promise<void> {
    const entity = await this.jobRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Job with id ${id} not found`);
    }
    if (
      entity.status !== JobStatus.COMPLETED &&
      entity.status !== JobStatus.CANCELLED &&
      entity.status !== JobStatus.FAILED
    ) {
      throw new ConflictException(
        `Can only delete completed, failed, or cancelled jobs, got ${entity.status}`
      );
    }
    await this.jobRepository.delete(id);
    this.sseService.broadcast({ type: 'job:deleted', payload: { id } });
  }

  toResponseDto(entity: JobEntity): JobResponseDto {
    return plainToInstance(JobResponseDto, instanceToPlain(entity), {
      excludeExtraneousValues: true,
    });
  }
}
