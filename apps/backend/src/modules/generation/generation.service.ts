import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { JobEntity, JobType } from '@/modules/jobs/entities/job.entity';

export interface GenerationResult {
  resultUrl?: string;
  resultText?: string;
}

@Injectable()
export class GenerationService {
  private readonly IMAGE_TIMEOUT_MS = 8000;
  private readonly TEXT_TIMEOUT_MS = 10000;

  constructor(private readonly httpService: HttpService) {}

  async generate(job: JobEntity): Promise<GenerationResult> {
    const prompt = job.enhancedPrompt ?? job.prompt;

    if (job.type === JobType.IMAGE) {
      return this.generateImage(prompt);
    }
    return this.generateText(prompt);
  }

  private async generateImage(prompt: string): Promise<GenerationResult> {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`;

    await firstValueFrom(
      this.httpService.get(url, {
        timeout: this.IMAGE_TIMEOUT_MS,
        validateStatus: (status) => status >= 200 && status < 300,
      })
    );

    return { resultUrl: url };
  }

  private async generateText(prompt: string): Promise<GenerationResult> {
    const response = await firstValueFrom(
      this.httpService.post(
        'https://text.pollinations.ai/',
        {
          messages: [{ role: 'user', content: prompt }],
          model: 'openai',
        },
        {
          timeout: this.TEXT_TIMEOUT_MS,
          responseType: 'text',
        }
      )
    );

    const text =
      typeof response.data === 'string'
        ? response.data
        : String(response.data ?? '');
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Text generation returned empty response');
    }
    return { resultText: trimmed };
  }
}
