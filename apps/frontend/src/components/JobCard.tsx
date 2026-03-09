'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  Skeleton,
  LinearProgress,
  Box,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplayIcon from '@mui/icons-material/Replay';
import CancelIcon from '@mui/icons-material/Cancel';
import { type Job } from '@/types';
import { timeAgo } from '@/lib';

interface JobCardProps {
  job: Job;
  onRetry?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
}

const STATUS_CHIP_SX = {
  pending: {},
  generating: {
    color: 'primary.main',
    animation: 'statusPulse 1.5s ease-in-out infinite',
    '@keyframes statusPulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.6 },
    },
  },
  completed: { bgcolor: 'success.main', color: 'success.contrastText' },
  failed: { bgcolor: 'error.main', color: 'error.contrastText' },
  cancelled: {},
} as const;

function PromptDisplay({
  prompt,
  expanded,
  onToggle,
}: {
  prompt: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const needsExpand = prompt.length > 80;
  return (
    <Box>
      <Typography
        variant="body2"
        sx={{
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: expanded ? 'unset' : 2,
          WebkitBoxOrient: 'vertical',
          color: 'text.secondary',
        }}
      >
        {prompt}
      </Typography>
      {needsExpand && (
        <Typography
          component="button"
          variant="caption"
          onClick={onToggle}
          sx={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'primary.main',
            p: 0,
            mt: 0.5,
            textAlign: 'left',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Typography>
      )}
    </Box>
  );
}

export function JobCard({ job, onRetry, onCancel }: JobCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);

  const displayPrompt = job.enhancedPrompt ?? job.prompt;
  const isEnhanced = !!job.enhancedPrompt;
  const canRetry =
    (job.status === 'failed' || job.status === 'cancelled') && !!onRetry;
  const canCancel =
    (job.status === 'pending' || job.status === 'generating') && !!onCancel;

  const handleCopyPrompt = async () => {
    try {
      // eslint-disable-next-line no-undef -- clipboard is browser-only
      await navigator.clipboard.writeText(job.prompt);
    } catch {
      // clipboard API unavailable (e.g. SSR)
    }
  };

  return (
    <Card
      sx={{
        position: 'relative',
        borderRadius: 2,
        boxShadow: 1,
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 2,
        },
      }}
    >
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1.5,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Chip
              label={job.status}
              size="small"
              sx={{
                textTransform: 'capitalize',
                ...STATUS_CHIP_SX[job.status],
              }}
            />
            {isEnhanced && (
              <Chip label="✨ enhanced" size="small" variant="outlined" />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {timeAgo(job.createdAt)}
          </Typography>
        </Box>

        <PromptDisplay
          prompt={displayPrompt}
          expanded={promptExpanded}
          onToggle={() => setPromptExpanded((e) => !e)}
        />

        {job.type === 'image' && job.resultUrl && (
          <Box
            sx={{
              position: 'relative',
              mt: 2,
              borderRadius: 1,
              overflow: 'hidden',
              aspectRatio: '1',
              bgcolor: 'action.hover',
            }}
          >
            {!imageLoaded && (
              <Skeleton
                variant="rectangular"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                }}
              />
            )}
            <Image
              src={job.resultUrl}
              alt={job.prompt}
              fill
              sizes="(max-width: 600px) 100vw, 400px"
              style={{ objectFit: 'cover' }}
              onLoad={() => setImageLoaded(true)}
            />
          </Box>
        )}

        {job.type === 'text' && job.resultText && (
          <Paper
            variant="outlined"
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {job.resultText}
            </Typography>
          </Paper>
        )}

        {job.status === 'failed' && job.errorMessage && (
          <Typography
            variant="caption"
            color="error"
            sx={{ display: 'block', mt: 1 }}
          >
            {job.errorMessage}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            mt: 2,
          }}
        >
          <Tooltip title="Copy prompt">
            <IconButton size="small" onClick={handleCopyPrompt}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canRetry && (
            <Tooltip title="Retry">
              <IconButton size="small" onClick={() => onRetry?.(job.id)}>
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canCancel && (
            <Tooltip title="Cancel">
              <IconButton size="small" onClick={() => onCancel?.(job.id)}>
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>

      {job.status === 'generating' && (
        <LinearProgress
          sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        />
      )}
    </Card>
  );
}
