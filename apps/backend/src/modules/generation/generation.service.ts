import { Injectable } from '@nestjs/common';
import { JobEntity } from '@/modules/jobs/entities/job.entity';

@Injectable()
export class GenerationService {
  async generate(job: JobEntity): Promise<string> {
    // Placeholder: AI generation logic to be implemented
    const enhancePrompt = !!job.enhancedPrompt;
    return `Generated for ${job.type}: ${job.prompt}${enhancePrompt ? ' (enhanced)' : ''}`;
  }
}
