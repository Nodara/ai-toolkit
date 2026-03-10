'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Collapse,
  Box,
  Typography,
  IconButton,
  Chip,
  Snackbar,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplayIcon from '@mui/icons-material/Replay';
import CancelIcon from '@mui/icons-material/Cancel';
import { useJobsHistory } from '@/hooks/useJobsHistory';
import { useDebounce } from '@/hooks/useDebounce';
import { API_URL, getUserFriendlyMessage, formatJobErrorMessage } from '@/lib';
import type { Job } from '@/types';

const PROMPT_MAX = 40;
const ROWS_PER_PAGE = 10;

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '…';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function RowActions({
  job,
  onRetry,
  onCancel,
}: {
  job: Job;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const canRetry = job.status === 'failed' || job.status === 'cancelled';
  const canCancel = job.status === 'pending' || job.status === 'generating';

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(job.prompt);
        }}
      >
        <ContentCopyIcon fontSize="small" />
      </IconButton>
      {canRetry && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onRetry(job.id);
          }}
        >
          <ReplayIcon fontSize="small" />
        </IconButton>
      )}
      {canCancel && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onCancel(job.id);
          }}
        >
          <CancelIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}

function ExpandableRow({
  job,
  onRetry,
  onCancel,
}: {
  job: Job;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer', '& > *': { borderBottom: 'unset' } }}
        onClick={() => setOpen((o) => !o)}
      >
        <TableCell sx={{ width: 48 }}>
          <IconButton size="small">
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{job.type}</TableCell>
        <TableCell sx={{ maxWidth: 200 }} title={job.prompt}>
          {truncate(job.prompt, PROMPT_MAX)}
        </TableCell>
        <TableCell>
          <Chip
            label={job.status}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        </TableCell>
        <TableCell>{job.enhancedPrompt ? 'Yes' : '—'}</TableCell>
        <TableCell>{formatDate(job.createdAt)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <RowActions job={job} onRetry={onRetry} onCancel={onCancel} />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} sx={{ py: 0, borderBottom: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, pl: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Full prompt
              </Typography>
              <Typography
                variant="body2"
                sx={{ mb: 2, whiteSpace: 'pre-wrap' }}
              >
                {job.prompt}
              </Typography>
              {job.enhancedPrompt && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Enhanced prompt
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 2, whiteSpace: 'pre-wrap' }}
                  >
                    {job.enhancedPrompt}
                  </Typography>
                </>
              )}
              <Typography variant="subtitle2" gutterBottom>
                Result preview
              </Typography>
              {job.type === 'image' && job.resultUrl && (
                <Box
                  sx={{
                    position: 'relative',
                    width: 120,
                    height: 120,
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: 'action.hover',
                  }}
                >
                  <Image
                    src={job.resultUrl}
                    alt={job.prompt}
                    fill
                    sizes="120px"
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
              )}
              {job.type === 'text' && job.resultText && (
                <Typography
                  variant="body2"
                  sx={{
                    maxHeight: 120,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    bgcolor: 'action.hover',
                    p: 1.5,
                    borderRadius: 1,
                  }}
                >
                  {job.resultText.length > 200
                    ? job.resultText.slice(0, 200) + '…'
                    : job.resultText}
                </Typography>
              )}
              {job.status === 'failed' && job.errorMessage && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ display: 'block', mt: 1 }}
                >
                  {formatJobErrorMessage(job.errorMessage)}
                </Typography>
              )}
              {!job.resultUrl && !job.resultText && job.status !== 'failed' && (
                <Typography variant="body2" color="text.secondary">
                  No result yet
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function HistoryPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [promptSearch, setPromptSearch] = useState('');
  const debouncedSearch = useDebounce(promptSearch, 300);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);

  const { jobs, loading, refetch } = useJobsHistory();

  const filteredAndSorted = useMemo(() => {
    let result = [...jobs];
    if (typeFilter !== 'all') {
      result = result.filter((j) => j.type === typeFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((j) => j.status === statusFilter);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (j) =>
          j.prompt.toLowerCase().includes(q) ||
          (j.enhancedPrompt?.toLowerCase().includes(q) ?? false)
      );
    }
    result.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? ta - tb : tb - ta;
    });
    return result;
  }, [jobs, typeFilter, statusFilter, debouncedSearch, sortOrder]);

  const paginated = useMemo(() => {
    const start = page * ROWS_PER_PAGE;
    return filteredAndSorted.slice(start, start + ROWS_PER_PAGE);
  }, [filteredAndSorted, page]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleRetry = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`${API_URL}/jobs/${id}/retry`, {
          method: 'POST',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg = getUserFriendlyMessage({
            status: res.status,
            message: (body as { message?: string | string[] }).message,
            context: 'retry',
          });
          throw new Error(msg);
        }
        refetch();
      } catch (err) {
        const msg =
          err instanceof Error
            ? getUserFriendlyMessage({ message: err.message, context: 'retry' })
            : 'Something went wrong. Please try again.';
        setSnackbarMessage(msg);
        setSnackbarOpen(true);
      }
    },
    [refetch]
  );

  const handleCancel = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`${API_URL}/jobs/${id}/cancel`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const msg = getUserFriendlyMessage({
            status: res.status,
            message: (body as { message?: string | string[] }).message,
            context: 'cancel',
          });
          throw new Error(msg);
        }
        refetch();
      } catch (err) {
        const msg =
          err instanceof Error
            ? getUserFriendlyMessage({
                message: err.message,
                context: 'cancel',
              })
            : 'Something went wrong. Please try again.';
        setSnackbarMessage(msg);
        setSnackbarOpen(true);
      }
    },
    [refetch]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="image">Image</MenuItem>
            <MenuItem value="text">Text</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="generating">Generating</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder="Search prompt…"
          value={promptSearch}
          onChange={(e) => setPromptSearch(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <Chip
          label={`Sort: ${sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}`}
          onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
          sx={{ cursor: 'pointer' }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48 }} />
              <TableCell>Type</TableCell>
              <TableCell>Prompt</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Enhanced</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary">
                      Loading…
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No jobs match your filters
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((job) => (
                <ExpandableRow
                  key={job.id}
                  job={job}
                  onRetry={handleRetry}
                  onCancel={handleCancel}
                />
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredAndSorted.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={ROWS_PER_PAGE}
          rowsPerPageOptions={[ROWS_PER_PAGE]}
        />
      </TableContainer>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
