import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JobsService } from '@/modules/jobs/jobs.service';
import { CreateJobDto } from '@/modules/jobs/dto/create-job.dto';
import { JobFilterDto } from '@/modules/jobs/dto/job-filter.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  create(@Body() dto: CreateJobDto) {
    return this.jobsService.createJob(dto);
  }

  @Get()
  findAll(@Query() filter: JobFilterDto) {
    return this.jobsService.findAll(filter);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findOne(id);
  }

  @Delete(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.cancelJob(id);
  }

  @Post(':id/retry')
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.retryJob(id);
  }
}
