import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { JobResponseDto } from '@/modules/jobs/dto/job-response.dto';

export interface SseEvent {
  type:
    | 'job:created'
    | 'job:updated'
    | 'job:completed'
    | 'job:failed'
    | 'job:deleted'
    | 'heartbeat'
    | 'connected';
  payload?: JobResponseDto | { clientId: string } | { id: string };
}

@Injectable()
export class SseService {
  private readonly clients = new Map<string, Response>();

  addClient(clientId: string, res: Response): void {
    this.clients.set(clientId, res);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  broadcast(event: SseEvent): void {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const [clientId, res] of this.clients.entries()) {
      try {
        res.write(data);
      } catch {
        this.removeClient(clientId);
      }
    }
  }

  sendToClient(clientId: string, event: SseEvent): void {
    const res = this.clients.get(clientId);
    if (!res) return;
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      this.removeClient(clientId);
    }
  }
}
