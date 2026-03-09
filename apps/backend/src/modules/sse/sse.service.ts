import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface SseEvent {
  type: string;
  data: unknown;
}

@Injectable()
export class SseService {
  private readonly eventSubject = new Subject<SseEvent>();

  get eventStream() {
    return this.eventSubject.asObservable();
  }

  emit(event: SseEvent): void {
    this.eventSubject.next(event);
  }
}
