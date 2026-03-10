'use client';

// MUI v7.3.9 + @mui/material-nextjs v7.3.9 — compatible with Next.js 16 App Router
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme';
import { ApiStatusProvider } from '@/contexts/ApiStatusContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <ApiStatusProvider>{children}</ApiStatusProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
