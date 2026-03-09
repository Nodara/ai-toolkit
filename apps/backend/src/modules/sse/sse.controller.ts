import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { SseService } from '@/modules/sse/sse.service';

@Controller()
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Get('events')
  events(
    @Req() req: Request,
    @Res({ passthrough: false }) res: Response
  ): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = randomUUID();
    this.sseService.addClient(clientId, res);
    this.sseService.sendToClient(clientId, {
      type: 'connected',
      payload: { clientId },
    });

    const heartbeatId = setInterval(() => {
      this.sseService.sendToClient(clientId, { type: 'heartbeat' });
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeatId);
      this.sseService.removeClient(clientId);
    });
  }
}
