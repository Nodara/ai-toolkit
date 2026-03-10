# Backend

NestJS API for the Mini AI Toolkit. Exposes REST endpoints for job CRUD, generation queue, and SSE for real-time updates. Depends on PostgreSQL (persistence) and Redis (BullMQ job queue).

## Tech Stack

| Technology | Version |
|------------|---------|
| NestJS | 11.1.16 |
| TypeORM | 0.3.28 |
| BullMQ | 5.70.4 |
| PostgreSQL | 17 (Docker) |
| Redis | alpine (Docker) |
| Node.js | 22 LTS |

## Project Structure

```
src/
├── app.module.ts          # Root module, imports all feature modules
├── main.ts                # Bootstrap, CORS, global pipes/filters, DB retry
├── config/                # AppConfigService, env config
├── common/                # GlobalExceptionFilter, shared types
├── database/              # TypeORM config, migrations
└── modules/
    ├── generation/        # GenerationService (pollinations), PromptEnhancementService
    ├── health/            # GET /health, DB + Redis checks
    ├── jobs/              # JobsController, JobsService, GenerationProcessor, DTOs, entities
    ├── queue/             # BullMQ config
    └── sse/               # SSE controller, broadcast service
```

## Getting Started (standalone)

1. PostgreSQL and Redis running (local or Docker)
2. `cp .env.example .env` — set `DATABASE_URL`, `REDIS_URL`
3. `pnpm install` (from repo root)
4. `pnpm --filter backend dev`

Migrations run automatically on startup.

## Available Scripts

| Script | Description |
|--------|-------------|
| `dev` | Nest start --watch |
| `build` | Compile to dist/ |
| `migration:generate` | Generate migration from entity changes |
| `migration:run` | Run pending migrations (standalone; app also runs them on boot) |

## API Reference

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| POST | `/jobs` | Create job, enqueue for generation | 202, Job |
| GET | `/jobs` | List jobs (paginated, filterable) | 200, PaginatedResponse |
| GET | `/jobs/:id` | Get single job | 200, Job |
| DELETE | `/jobs/:id/cancel` | Cancel pending/generating job | 200, Job |
| DELETE | `/jobs/:id` | Delete completed/failed/cancelled job | 204 |
| POST | `/jobs/:id/retry` | Retry failed/cancelled job | 200, Job |
| GET | `/events` | SSE stream for job updates | 200, stream |
| GET | `/health` | Health check (DB, Redis) | 200, HealthResult |

### POST /jobs

```typescript
interface CreateJobBody {
  prompt: string;        // 3–500 chars
  type: 'image' | 'text';
  enhancePrompt?: boolean;  // default false
  priority?: number;  // 0–5, default 0
}
```

### GET /jobs

Query params: `type` (image|text), `status` (pending|generating|completed|failed|cancelled), `page` (default 1), `limit` (default 20).

## Job Lifecycle

```
PENDING → (worker picks up) → GENERATING → (success) → COMPLETED
                            → (failed)   → FAILED
         (user cancels)     → CANCELLED

FAILED / CANCELLED → (user retries) → PENDING
```

- **Worker picks up**: BullMQ worker processes job, sets status to GENERATING.
- **Success**: GenerationService returns resultUrl/resultText. Job marked COMPLETED.
- **Failed**: Generation error or timeout (30s). Job marked FAILED, errorMessage stored.
- **User cancels**: Only for PENDING or GENERATING. Removes from queue if waiting, sets CANCELLED.
- **User retries**: Only for FAILED or CANCELLED. Resets status to PENDING, re-enqueues.

## Database Migrations

Never use `synchronize: true` in production. Use migrations:

1. Change entities
2. `pnpm --filter backend build`
3. `pnpm --filter backend migration:generate -- src/database/migrations/DescriptiveName`
4. Review generated migration
5. `pnpm --filter backend migration:run` (or let app run them on startup)

Migrations live in `src/database/migrations/`.

## AI Integration

**Primary — pollinations.ai**

Free, no auth. Images: GET `https://image.pollinations.ai/prompt/{encodedPrompt}?width=512&height=512&nologo=true` — the URL itself is the result (redirects to generated image). Text: POST `https://text.pollinations.ai/` with `{ messages: [{ role: 'user', content: prompt }], model: 'openai' }`, responseType: text. Image timeout 8s, text timeout 10s.

**Fallback**

If pollinations fails or times out, the job fails and is marked FAILED. No fallback to picsum or placeholder text currently.

**Prompt enhancement**

Optional pre-processing step when `enhancePrompt: true`. Calls pollinations text API to improve the prompt for generation. Uses a 2.5s race: if enhancement doesn’t finish in time, original prompt is used. Result stored in `enhanced_prompt` when different from original.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL |
| `REDIS_HOST` | Redis host (fallback when REDIS_URL not set) |
| `REDIS_PORT` | Redis port (fallback) |
| `PORT` | HTTP port (default 3001) |
| `CORS_ORIGIN` | Allowed CORS origin |

## Error Handling

**GlobalExceptionFilter** — catches all unhandled exceptions:

| Exception | HTTP Status |
|-----------|-------------|
| EntityNotFoundError | 404 |
| QueryFailedError | 500 (generic message, no SQL leak) |
| HttpException (Nest) | Pass-through |
| Other | 500 |

**DB connection retry** — On startup, if DB connection fails: retry up to 5 times with 3s delay. Logs each attempt. On final failure, throws and exits.

## What I'd Improve With More Time

- Unit + integration tests (Jest)
- Bull Board for queue monitoring UI
- Rate limiting (throttler)
- S3/R2 for storing generated images instead of direct URLs
- Auth with JWT
- Prompt moderation before queuing
