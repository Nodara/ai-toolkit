import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GenerationService } from '@/modules/generation/generation.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  providers: [GenerationService],
  exports: [GenerationService],
})
export class GenerationModule {}
