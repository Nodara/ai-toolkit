export type JobType = 'image' | 'text';

export type JobStatus =
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  prompt: string;
  enhancedPrompt: string | null;
  resultUrl: string | null;
  resultText: string | null;
  errorMessage: string | null;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

export type SseEventType =
  | 'job:created'
  | 'job:updated'
  | 'job:completed'
  | 'job:failed'
  | 'job:deleted'
  | 'heartbeat'
  | 'connected';

export type SseEventPayload =
  | Job
  | { id: string }
  | { clientId: string }
  | undefined;

export interface SseEvent {
  type: SseEventType;
  payload?: SseEventPayload;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
