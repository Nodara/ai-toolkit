import { Injectable } from '@nestjs/common';

@Injectable()
export class GenerationService {
  async generate(payload: { type: string; prompt: string }): Promise<string> {
    // Placeholder: AI generation logic to be implemented
    return `Generated for ${payload.type}: ${payload.prompt}`;
  }
}
