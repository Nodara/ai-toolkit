import type { ApiErrorResponse, Job, PaginatedResponse } from '@/common/types';
import { API_URL } from './env';
import { getUserFriendlyMessage } from './errorMessages';

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

async function handleError(res: Response): Promise<never> {
  const body = await parseJson<ApiErrorResponse>(res);
  const rawMessage =
    typeof body.message === 'string'
      ? body.message
      : Array.isArray(body.message)
        ? body.message.join(', ')
        : `Request failed: ${res.status}`;
  const message = getUserFriendlyMessage({
    status: res.status,
    message: rawMessage,
  });
  throw new Error(message);
}

export async function fetchJobs(params: {
  type?: string;
  status?: string;
  limit?: number;
}): Promise<PaginatedResponse<Job>> {
  const searchParams = new URLSearchParams();
  if (params.type && params.type !== 'all')
    searchParams.set('type', params.type);
  if (params.status && params.status !== 'all')
    searchParams.set('status', params.status);
  searchParams.set('limit', String(params.limit ?? 100));

  const res = await fetch(`${API_URL}/jobs?${searchParams}`);
  if (!res.ok) await handleError(res);
  return parseJson<PaginatedResponse<Job>>(res);
}

export async function createJob(payload: {
  prompt: string;
  type: 'image' | 'text';
  enhancePrompt?: boolean;
  priority?: number;
}): Promise<Job> {
  const res = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await handleError(res);
  return parseJson<Job>(res);
}

export async function retryJob(jobId: string): Promise<Job> {
  const res = await fetch(`${API_URL}/jobs/${jobId}/retry`, {
    method: 'POST',
  });
  if (!res.ok) await handleError(res);
  return parseJson<Job>(res);
}

export async function cancelJob(jobId: string): Promise<Job> {
  const res = await fetch(`${API_URL}/jobs/${jobId}/cancel`, {
    method: 'DELETE',
  });
  if (!res.ok) await handleError(res);
  return parseJson<Job>(res);
}

export async function deleteJob(jobId: string): Promise<void> {
  const res = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: 'DELETE',
  });
  if (!res.ok) await handleError(res);
}
