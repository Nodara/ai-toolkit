# Mini AI Toolkit

Generate images and text from prompts via a simple API. NestJS + Next.js monorepo with PostgreSQL, Redis, BullMQ, and SSE for real-time updates.

## Prerequisites

| Docker | Manual |
|--------|--------|
| Docker Desktop 4.x+ | Node.js 22 LTS |
| Docker Compose v2 | pnpm 10.31+ |

## Quick Start

| Service | Port |
|---------|------|
| Frontend | 3000 |
| Backend | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |

```bash
docker compose up -d
```

Open http://localhost:3000

## Manual Dev Setup

1. Install pnpm: `corepack enable && corepack prepare pnpm@10.31.0 --activate`
2. Install deps: `pnpm install`
3. Start PostgreSQL and Redis (Docker or local)
4. Copy `.env.example` to `.env` and set `DATABASE_URL`, `REDIS_URL`
5. Start dev: `pnpm dev` (backend runs migrations on startup)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | PostgreSQL database name |
| `DATABASE_URL` | Full PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/db`) |
| `REDIS_URL` | Redis connection URL (e.g. `redis://localhost:6379`) |
| `REDIS_HOST` | Redis host (fallback when `REDIS_URL` not set) |
| `REDIS_PORT` | Redis port (fallback when `REDIS_URL` not set) |
| `PORT` | Backend HTTP port |
| `CORS_ORIGIN` | Allowed CORS origin for API requests |
| `NEXT_PUBLIC_API_URL` | Backend API base URL (exposed to browser) |

## Project Structure

```
apps/
├── backend/   → [Backend README](apps/backend/README.md)
└── frontend/  → [Frontend README](apps/frontend/README.md)
```

## Tech Stack

| Technology | Why |
|------------|-----|
| NestJS | API framework, DI, modules |
| TypeORM | PostgreSQL ORM, migrations |
| BullMQ + Redis | Job queue, retries, concurrency |
| PostgreSQL | Persistent storage |
| Next.js | React framework, App Router |
| MUI | Component library |
| SSE | Real-time job updates |

## Contributing

Install deps from root (`pnpm install`). Husky runs on commit: eslint + prettier on staged files. TypeScript strict mode enabled in both apps.
