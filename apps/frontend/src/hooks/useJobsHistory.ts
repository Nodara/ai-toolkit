'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Job } from '@/types';
import { API_URL } from '@/lib';
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
        const is5xx = res.status >= 500;
        throw new Error(
          is5xx
            ? 'Server error. Please try again later.'
            : 'Failed to fetch jobs'
        );
      }
      const data = await res.json();
      setJobs(data.data ?? []);
    } catch (err) {
      setJobs([]);
      setApiError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [setApiError]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, refetch: fetchJobs };
}
