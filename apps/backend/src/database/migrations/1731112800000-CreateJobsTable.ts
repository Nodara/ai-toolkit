import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobsTable1731112800000 implements MigrationInterface {
  name = 'CreateJobsTable1731112800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "jobs_type_enum" AS ENUM ('image', 'text')
    `);
    await queryRunner.query(`
      CREATE TYPE "jobs_status_enum" AS ENUM (
        'pending',
        'generating',
        'completed',
        'failed',
        'cancelled'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" "jobs_type_enum" NOT NULL,
        "status" "jobs_status_enum" NOT NULL DEFAULT 'pending',
        "prompt" character varying(4096) NOT NULL,
        "enhanced_prompt" character varying(8192),
        "result_url" character varying(2048),
        "result_text" text,
        "error_message" character varying(1024),
        "priority" integer NOT NULL DEFAULT 0,
        "retry_count" integer NOT NULL DEFAULT 0,
        "max_retries" integer NOT NULL DEFAULT 3,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jobs" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TYPE "jobs_status_enum"`);
    await queryRunner.query(`DROP TYPE "jobs_type_enum"`);
  }
}
