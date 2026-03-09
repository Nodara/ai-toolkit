import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum JobType {
  IMAGE = 'image',
  TEXT = 'text',
}

export enum JobStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('jobs')
export class JobEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: JobType,
  })
  type!: JobType;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status!: JobStatus;

  @Column({ type: 'varchar', length: 4096 })
  prompt!: string;

  @Column({
    type: 'varchar',
    length: 8192,
    nullable: true,
    name: 'enhanced_prompt',
  })
  enhancedPrompt!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true, name: 'result_url' })
  resultUrl!: string | null;

  @Column({ type: 'text', nullable: true, name: 'result_text' })
  resultText!: string | null;

  @Column({
    type: 'varchar',
    length: 1024,
    nullable: true,
    name: 'error_message',
  })
  errorMessage!: string | null;

  @Column({ type: 'int', default: 0 })
  priority!: number;

  @Column({ type: 'int', default: 0, name: 'retry_count' })
  retryCount!: number;

  @Column({ type: 'int', default: 3, name: 'max_retries' })
  maxRetries!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
