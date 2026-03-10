'use client';

import { useState, useCallback } from 'react';
import {
  Container,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Box,
  Typography,
  Snackbar,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import InboxIcon from '@mui/icons-material/Inbox';
import ClearIcon from '@mui/icons-material/Clear';
import { PromptForm, JobCard, JobCardSkeleton } from '@/components';
import { useJobs } from '@/hooks';
import type { JobTypeFilter, JobStatusFilter } from '@/hooks/useJobs';

const TYPE_OPTIONS: { value: JobTypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'image', label: 'Images' },
  { value: 'text', label: 'Text' },
];

const STATUS_OPTIONS: { value: JobStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'generating', label: 'Generating' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Home() {
  const [typeFilter, setTypeFilter] = useState<JobTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('all');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { jobs, loading, newIds, retryJob, cancelJob } = useJobs({
    typeFilter,
    statusFilter,
  });

  const handleRetry = useCallback(
    async (jobId: string) => {
      try {
        await retryJob(jobId);
      } catch (err) {
        setSnackbarMessage(err instanceof Error ? err.message : 'Retry failed');
        setSnackbarOpen(true);
      }
    },
    [retryJob]
  );

  const handleCancel = useCallback(
    async (jobId: string) => {
      try {
        await cancelJob(jobId);
      } catch (err) {
        setSnackbarMessage(
          err instanceof Error ? err.message : 'Cancel failed'
        );
        setSnackbarOpen(true);
      }
    },
    [cancelJob]
  );

  const hasActiveFilters = typeFilter !== 'all' || statusFilter !== 'all';
  const clearFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <PromptForm />
      </Paper>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
          mb: 3,
        }}
      >
        <ToggleButtonGroup
          value={typeFilter}
          exclusive
          onChange={(_, v) => v != null && setTypeFilter(v)}
          size="small"
        >
          {TYPE_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value}>
              {opt.value === 'image' && (
                <ImageIcon sx={{ mr: 0.5 }} fontSize="small" />
              )}
              {opt.value === 'text' && (
                <TextFieldsIcon sx={{ mr: 0.5 }} fontSize="small" />
              )}
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, v) => v != null && setStatusFilter(v)}
          size="small"
        >
          {STATUS_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {hasActiveFilters && (
          <Button size="small" startIcon={<ClearIcon />} onClick={clearFilters}>
            Clear
          </Button>
        )}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2,
        }}
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Box key={i}>
              <JobCardSkeleton />
            </Box>
          ))
        ) : jobs.length === 0 ? (
          <Box
            sx={{
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              color: 'text.secondary',
            }}
          >
            <InboxIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="body1">No jobs match your filters</Typography>
          </Box>
        ) : (
          jobs.map((job) => (
            <Box
              key={job.id}
              sx={{
                opacity: newIds.has(job.id) ? 0 : 1,
                transform: newIds.has(job.id)
                  ? 'translateY(-8px)'
                  : 'translateY(0)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
              }}
            >
              <JobCard
                job={job}
                onRetry={handleRetry}
                onCancel={handleCancel}
              />
            </Box>
          ))
        )}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}
