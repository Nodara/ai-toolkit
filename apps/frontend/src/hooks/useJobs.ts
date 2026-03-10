'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { type Job } from '@/types';
import { API_URL } from '@/lib';
import { useApiStatus } from '@/contexts/ApiStatusContext';

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

export function useJobs(options: UseJobsOptions = {}) {
  const { typeFilter = 'all', statusFilter = 'all' } = options;
  const { setApiError, setSseConnected } = useApiStatus();
  const [jobsMap, setJobsMap] = useState<Map<string, Job>>(new Map());
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const sseRef = useRef<EventSource | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('limit', '100');
      const res = await fetch(`${API_URL}/jobs?${params}`);
      if (!res.ok) {
        const is5xx = res.status >= 500;
        throw new Error(
          is5xx
            ? 'Server error. Please try again later.'
            : 'Failed to fetch jobs'
        );
      }
      const data = await res.json();
      const jobs: Job[] = data.data ?? [];
      const map = new Map<string, Job>();
      jobs.forEach((job: Job) => map.set(job.id, job));
      setJobsMap(map);
    } catch (err) {
      setJobsMap(new Map());
      setApiError(err instanceof Error ? err.message : 'Failed to fetch jobs');
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
    /* eslint-disable no-undef -- EventSource is browser-only */
    const es = new EventSource(`${API_URL}/events`);
    sseRef.current = es;

    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);

    es.onmessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data);
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

  const retryJob = useCallback(async (jobId: string) => {
    const res = await fetch(`${API_URL}/jobs/${jobId}/retry`, {
      method: 'POST',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as { message?: string }).message ?? 'Retry failed';
      throw new Error(msg);
    }
    const job = await res.json();
    setJobsMap((prev) => {
      const next = new Map(prev);
      next.set(job.id, job);
      return next;
    });
  }, []);

  const cancelJob = useCallback(async (jobId: string) => {
    const res = await fetch(`${API_URL}/jobs/${jobId}/cancel`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as { message?: string }).message ?? 'Cancel failed';
      throw new Error(msg);
    }
    const job = await res.json();
    setJobsMap((prev) => {
      const next = new Map(prev);
      next.set(job.id, job);
      return next;
    });
  }, []);

  return {
    jobs: filteredJobs,
    loading,
    newIds,
    retryJob,
    cancelJob,
    refetch: fetchJobs,
  };
}
