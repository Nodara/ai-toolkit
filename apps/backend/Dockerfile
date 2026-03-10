# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY apps/backend ./apps/backend

RUN pnpm install --frozen-lockfile
RUN pnpm --filter backend build

# ---
FROM node:22-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/backend ./apps/backend

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["node", "dist/main.js"]
