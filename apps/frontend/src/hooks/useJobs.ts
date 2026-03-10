'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Job } from '@/common/types';
import {
  API_URL,
  getUserFriendlyMessage,
  fetchJobs as apiFetchJobs,
  retryJob as apiRetryJob,
  cancelJob as apiCancelJob,
  deleteJob as apiDeleteJob,
} from '@/lib';
import { useApiStatus } from '@/contexts/ApiStatusContext';
import type { SseEvent } from '@/common/types';

export type JobTypeFilter = 'all' | 'image' | 'text';
export type JobStatusFilter =
  | 'all'
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface UseJobsOptions {
  typeFilter?: JobTypeFilter;
  statusFilter?: JobStatusFilter;
}

function jobMatchesFilters(
  job: Job,
  typeFilter: JobTypeFilter,
  statusFilter: JobStatusFilter
): boolean {
  if (typeFilter !== 'all' && job.type !== typeFilter) return false;
  if (statusFilter !== 'all' && job.status !== statusFilter) return false;
  return true;
}

export interface UseJobsReturn {
  jobs: Job[];
  loading: boolean;
  newIds: Set<string>;
  retryJob: (jobId: string) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useJobs(options: UseJobsOptions = {}): UseJobsReturn {
  const { typeFilter = 'all', statusFilter = 'all' } = options;
  const { setApiError, setSseConnected } = useApiStatus();
  const [jobsMap, setJobsMap] = useState<Map<string, Job>>(new Map());
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const sseRef = useRef<EventSource | null>(null);

  const fetchJobs = useCallback(async (): Promise<void> => {
    setLoading(true);
    setApiError(null);
    try {
      const result = await apiFetchJobs({
        type: typeFilter,
        status: statusFilter,
        limit: 100,
      });
      const map = new Map<string, Job>();
      result.data.forEach((job: Job) => map.set(job.id, job));
      setJobsMap(map);
    } catch (err) {
      setJobsMap(new Map());
      const msg =
        err instanceof Error
          ? getUserFriendlyMessage({ message: err.message })
          : 'Something went wrong. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, setApiError]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (sseRef.current) {
      sseRef.current.close();
    }
    setSseConnected(false);
    const es = new EventSource(`${API_URL}/events`);
    sseRef.current = es;

    es.onopen = (): void => setSseConnected(true);
    es.onerror = (): void => setSseConnected(false);

    es.onmessage = (e: globalThis.MessageEvent<string>): void => {
      try {
        const event = JSON.parse(e.data) as SseEvent;
        const payload = event.payload;
        if (!payload || typeof payload !== 'object') return;

        if (event.type === 'job:created') {
          const job = payload as Job;
          if (job.id) {
            setJobsMap((prev) => {
              const next = new Map(prev);
              next.set(job.id, job);
              return next;
            });
            setNewIds((prev) => new Set(prev).add(job.id));
            setTimeout(() => {
              setNewIds((p) => {
                const n = new Set(p);
                n.delete(job.id);
                return n;
              });
            }, 500);
          }
        } else if (
          ['job:updated', 'job:completed', 'job:failed'].includes(event.type)
        ) {
          const job = payload as Job;
          if (job.id) {
            setJobsMap((prev) => {
              const next = new Map(prev);
              next.set(job.id, job);
              return next;
            });
          }
        } else if (event.type === 'job:deleted') {
          const { id } = payload as { id: string };
          if (id) {
            setJobsMap((prev) => {
              const next = new Map(prev);
              next.delete(id);
              return next;
            });
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      es.close();
      sseRef.current = null;
      setSseConnected(false);
    };
  }, [setSseConnected]);

  const jobs = Array.from(jobsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredJobs = jobs.filter((job) =>
    jobMatchesFilters(job, typeFilter, statusFilter)
  );

  const retryJob = useCallback(async (jobId: string): Promise<void> => {
    const job = await apiRetryJob(jobId);
    setJobsMap((prev) => {
      const next = new Map(prev);
      next.set(job.id, job);
      return next;
    });
  }, []);

  const cancelJob = useCallback(async (jobId: string): Promise<void> => {
    const job = await apiCancelJob(jobId);
    setJobsMap((prev) => {
      const next = new Map(prev);
      next.set(job.id, job);
      return next;
    });
  }, []);

  const deleteJob = useCallback(async (jobId: string): Promise<void> => {
    await apiDeleteJob(jobId);
    setJobsMap((prev) => {
      const next = new Map(prev);
      next.delete(jobId);
      return next;
    });
  }, []);

  return {
    jobs: filteredJobs,
    loading,
    newIds,
    retryJob,
    cancelJob,
    deleteJob,
    refetch: fetchJobs,
  };
}
