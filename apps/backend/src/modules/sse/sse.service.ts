import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import type { SseEvent } from '@/common/types';

export type { SseEvent };

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
