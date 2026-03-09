import { Controller, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SseService } from '@/modules/sse/sse.service';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('events')
  events(): Observable<{ data: unknown }> {
    return this.sseService.eventStream.pipe(
      map((event) => ({
        data: { type: event.type, data: event.data },
      }))
    );
  }
}
