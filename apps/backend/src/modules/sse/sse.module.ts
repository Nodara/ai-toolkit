import { Module } from '@nestjs/common';
import { SseController } from '@/modules/sse/sse.controller';
import { SseService } from '@/modules/sse/sse.service';

@Module({
  controllers: [SseController],
  providers: [SseService],
  exports: [SseService],
})
export class SseModule {}
