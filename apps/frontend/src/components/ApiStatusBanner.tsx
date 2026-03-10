'use client';

import { Alert } from '@mui/material';
import { useApiStatus } from '@/contexts/ApiStatusContext';

export function ApiStatusBanner() {
  const { apiError, setApiError } = useApiStatus();

  if (!apiError) return null;

  return (
    <Alert
      severity="error"
      onClose={() => setApiError(null)}
      sx={{
        borderRadius: 0,
        '& .MuiAlert-message': { width: '100%' },
      }}
    >
      {apiError}
    </Alert>
  );
}
