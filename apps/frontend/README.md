# Frontend

Next.js app for the Mini AI Toolkit. Gallery view, history table, prompt form, and real-time job updates via SSE. Connects to the NestJS backend API.

## Tech Stack

| Technology | Version |
|------------|---------|
| Next.js | 16.1.6 |
| React | 19.x |
| MUI | 7.3.9 |
| TypeScript | 5.9.3 |

## Project Structure

```
src/
├── app/                    # App Router pages and layout
│   ├── layout.tsx          # Root layout, nav, ApiStatusBanner
│   ├── page.tsx            # Gallery (/)
│   └── history/page.tsx    # History table (/history)
├── common/types/           # Job, SseEvent, ApiErrorResponse, PaginatedResponse
├── components/             # UI components
│   ├── AppNav.tsx          # Top nav with tabs, SSE status chip
│   ├── ApiStatusBanner.tsx # Persistent alert for API errors
│   ├── JobCard.tsx         # Job card (image/text, actions)
│   ├── JobCardSkeleton.tsx # Loading skeleton
│   ├── PromptForm.tsx      # Create job form
│   └── providers.tsx      # MUI ThemeProvider, ApiStatusProvider
├── contexts/
│   └── ApiStatusContext.tsx # apiError, sseConnected, shared across app
├── hooks/
│   ├── useDebounce.ts      # Debounce for search input
│   ├── useJobs.ts          # Jobs state, SSE, filters, CRUD actions (Gallery)
│   └── useJobsHistory.ts   # Jobs list for History page
├── lib/
│   ├── apiClient.ts        # Typed fetch wrappers (fetchJobs, createJob, etc.)
│   ├── env.ts              # API_URL
│   ├── errorMessages.ts    # getUserFriendlyMessage, formatJobErrorMessage
│   └── index.ts            # Exports, timeAgo
├── types/                  # Re-exports from common/types
└── theme.ts                # MUI dark theme
```

## Getting Started (standalone)

1. Backend running on port 3001 (or set `NEXT_PUBLIC_API_URL`)
2. `pnpm install` (from repo root)
3. `pnpm --filter frontend dev`

Open http://localhost:3000

## Available Scripts

| Script | Description |
|--------|-------------|
| `dev` | Next dev server |
| `build` | Production build (standalone output) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (exposed to browser, default http://localhost:3001) |

## Key Architectural Decisions

### Real-time Updates via SSE

`useJobs` opens a single `EventSource` to `/events` on mount. Listens for `job:created`, `job:updated`, `job:completed`, `job:failed`, `job:deleted`. Merges payloads into a `Map<string, Job>` and re-renders. `ApiStatusContext` tracks `sseConnected` (onopen/onerror); AppNav shows "● live updates off" when disconnected. No custom reconnection or backoff — EventSource has built-in reconnect; if backend is down, chip shows disconnected until it comes back.

### MUI Theme

Dark mode via `createTheme({ palette: { mode: 'dark' } })`. Uses `@mui/material-nextjs` for App Router compatibility. ThemeProvider wraps the app in `providers.tsx`.

### Next.js App Router Notes

All pages are `'use client'` (interactive). Layout is server-rendered; metadata in layout. `output: 'standalone'` for Docker. Images: `next/image` with `remotePatterns` for pollinations.ai and picsum.photos. Turbopack enabled for dev.

## Pages

### Gallery (/)

Prompt form, type/status filters, grid of JobCards. Uses `useJobs` for data + SSE. New jobs get a brief "slide in" animation via `newIds`. Retry/cancel/delete with Snackbar on error.

### History (/history)

Table with type/status filters, prompt search (debounced), sort toggle. Expandable rows for full prompt and result. Same retry/cancel/delete actions. Uses `useJobsHistory` (one-time fetch, no SSE); actions call apiClient and refetch.

## Component Notes

- **JobCard** — Shows prompt (expandable), image or text result, status chip, copy/retry/cancel/delete. Image load error → gray box with BrokenImage icon.
- **PromptForm** — Validates 3–500 chars, optional enhance toggle, priority slider. On submit: createJob, then reset form + Snackbar.
- **ApiStatusBanner** — Renders when `apiError` is set; dismissible. Used for fetch/network errors.
- **AppNav** — Tabs (Gallery, History), SSE chip when disconnected.

## What I'd Improve With More Time

- E2E tests with Playwright
- Optimistic UI (show card immediately before API responds)
- Infinite scroll instead of static grid
- Image lightbox on click
- Download button for generated images
- User preferences (localStorage) for default type/priority
