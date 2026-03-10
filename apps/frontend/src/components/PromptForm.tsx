'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  FormControlLabel,
  Tooltip,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  CircularProgress,
  Snackbar,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ImageIcon from '@mui/icons-material/Image';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { API_URL } from '@/lib';
import { useApiStatus } from '@/contexts/ApiStatusContext';

type JobType = 'image' | 'text';

interface CreateJobPayload {
  prompt: string;
  type: JobType;
  enhancePrompt?: boolean;
  priority?: number;
}

const PROMPT_MIN = 3;
const PROMPT_MAX = 500;

export function PromptForm() {
  const { setApiError } = useApiStatus();
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<JobType>('image');
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [priority, setPriority] = useState(0);
  const [promptError, setPromptError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const validatePrompt = (value: string): string => {
    if (value.length < PROMPT_MIN) {
      return `Prompt must be at least ${PROMPT_MIN} characters`;
    }
    if (value.length > PROMPT_MAX) {
      return `Prompt must be at most ${PROMPT_MAX} characters`;
    }
    return '';
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    setPromptError(validatePrompt(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validatePrompt(prompt);
    if (error) {
      setPromptError(error);
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateJobPayload = {
        prompt: prompt.trim(),
        type,
        enhancePrompt,
        priority,
      };
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          (err as { message?: string }).message ??
          `Request failed: ${res.status}`;
        setApiError(
          res.status >= 500 ? 'Server error. Please try again later.' : msg
        );
        throw new Error(msg);
      }
      setSnackbarOpen(true);
      setPrompt('');
      setPromptError('');
      setType('image');
      setEnhancePrompt(false);
      setPriority(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit';
      setPromptError(msg);
      if (
        err instanceof Error &&
        !msg.includes('at least') &&
        !msg.includes('at most')
      ) {
        setApiError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const helperText = promptError || `${prompt.length}/${PROMPT_MAX}`;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <TextField
        multiline
        minRows={3}
        maxRows={8}
        placeholder="describe what you want to generate..."
        value={prompt}
        onChange={(e) => handlePromptChange(e.target.value)}
        error={!!promptError}
        helperText={helperText}
        disabled={submitting}
        sx={{ mb: 2 }}
        fullWidth
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography
          component="span"
          variant="body2"
          sx={{ color: 'text.secondary' }}
        >
          Type:
        </Typography>
        <ToggleButtonGroup
          value={type}
          exclusive
          onChange={(_, v) => v != null && setType(v)}
          size="small"
          disabled={submitting}
        >
          <ToggleButton value="image" aria-label="image">
            <ImageIcon sx={{ mr: 0.5 }} />
            Image
          </ToggleButton>
          <ToggleButton value="text" aria-label="text">
            <TextFieldsIcon sx={{ mr: 0.5 }} />
            Text
          </ToggleButton>
        </ToggleButtonGroup>

        <Tooltip title="Use AI to improve your prompt before generation (adds ~2.5s to submission)">
          <FormControlLabel
            control={
              <Switch
                checked={enhancePrompt}
                onChange={(e) => setEnhancePrompt(e.target.checked)}
                disabled={submitting}
              />
            }
            label="Enhance prompt"
          />
        </Tooltip>
      </Box>

      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2">Advanced options</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', mb: 1 }}
          >
            Priority
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Low
            </Typography>
            <Slider
              value={priority}
              onChange={(_, v) => setPriority(v as number)}
              min={0}
              max={5}
              step={1}
              marks
              valueLabelDisplay="auto"
              disabled={submitting}
              sx={{ flex: 1 }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              High
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Button
          type="submit"
          variant="contained"
          disabled={submitting || !!promptError || prompt.length < PROMPT_MIN}
          sx={{ opacity: submitting ? 0.7 : 1 }}
        >
          Submit
        </Button>
        {submitting && (
          <CircularProgress
            size={24}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message="Job submitted!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
