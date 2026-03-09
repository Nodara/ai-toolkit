import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { JobType } from '@/modules/jobs/entities/job.entity';

@Injectable()
export class PromptEnhancementService {
  private readonly ENHANCEMENT_TIMEOUT_MS = 3000;

  constructor(private readonly httpService: HttpService) {}

  async enhance(prompt: string, type: JobType): Promise<string> {
    const typeLabel = type === JobType.IMAGE ? 'image' : 'text';
    const systemPrompt = `Enhance this prompt for AI ${typeLabel} generation. Return only the enhanced prompt, no explanation: ${prompt}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://text.pollinations.ai/',
          {
            messages: [{ role: 'user', content: systemPrompt }],
            model: 'openai',
          },
          {
            timeout: this.ENHANCEMENT_TIMEOUT_MS,
            responseType: 'text',
          }
        )
      );

      const text =
        typeof response.data === 'string'
          ? response.data
          : String(response.data ?? '');
      const trimmed = text.trim();
      return trimmed || prompt;
    } catch {
      return prompt;
    }
  }
}
