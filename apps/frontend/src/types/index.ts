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
