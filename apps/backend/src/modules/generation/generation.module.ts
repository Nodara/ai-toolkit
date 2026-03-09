import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GenerationService } from '@/modules/generation/generation.service';
import { PromptEnhancementService } from '@/modules/generation/prompt-enhancement.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [GenerationService, PromptEnhancementService],
  exports: [GenerationService, PromptEnhancementService],
})
export class GenerationModule {}
