'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Job } from '@/types';
import { API_URL, getUserFriendlyMessage } from '@/lib';
import { useApiStatus } from '@/contexts/ApiStatusContext';

export function useJobsHistory() {
  const { setApiError } = useApiStatus();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`${API_URL}/jobs?limit=500`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = getUserFriendlyMessage({
          status: res.status,
          message: (body as { message?: string | string[] }).message,
          context: 'fetch',
        });
        throw new Error(msg);
      }
      const data = await res.json();
      setJobs(data.data ?? []);
    } catch (err) {
      setJobs([]);
      const msg =
        err instanceof Error
          ? getUserFriendlyMessage({ message: err.message, context: 'fetch' })
          : 'Something went wrong. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }, [setApiError]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, refetch: fetchJobs };
}
