'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Job } from '@/common/types';
import { fetchJobs as apiFetchJobs, getUserFriendlyMessage } from '@/lib';
import { useApiStatus } from '@/contexts/ApiStatusContext';

export interface UseJobsHistoryReturn {
  jobs: Job[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useJobsHistory(): UseJobsHistoryReturn {
  const { setApiError } = useApiStatus();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async (): Promise<void> => {
    setLoading(true);
    setApiError(null);
    try {
      const result = await apiFetchJobs({ limit: 500 });
      setJobs(result.data);
    } catch (err) {
      setJobs([]);
      const msg =
        err instanceof Error
          ? getUserFriendlyMessage({ message: err.message })
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
