import { Module } from '@nestjs/common';
import { GenerationService } from '@/modules/generation/generation.service';

@Module({
  providers: [GenerationService],
  exports: [GenerationService],
})
export class GenerationModule {}
