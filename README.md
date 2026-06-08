# Mongolian Sign Language Interactive Platform

Monorepo for the MSL platform — verified sign-language dictionary, community
contribution, teacher approval with duplicate detection, and gamified learning.

> **Read first:** [`SPEC.md`](./SPEC.md) (source of truth), [`CLAUDE.md`](./CLAUDE.md)
> (conventions + non-negotiables), [`PLAN.md`](./PLAN.md) (build order),
> [`ASSUMPTIONS.md`](./ASSUMPTIONS.md) (adopted defaults).

## Stack

Next.js + React + TypeScript + Tailwind (web) · NestJS (api) · PostgreSQL + `pg_trgm`
· Prisma · Redis/BullMQ · object storage + signed URLs.

## Layout

```
apps/web      Next.js frontend (i18n, Mongolian default)
apps/api      NestJS REST API (/api/v1)
packages/types  Shared TS types / enums / contracts
packages/config Shared lint/TS/prettier base
prisma/       Schema, migrations, seed
```

## Getting started

```bash
# 1. Prereqs: Node >= 20, Docker
cp .env.example .env

# 2. Start infrastructure (Postgres + Redis)
docker compose up -d

# 3. Install
npm install

# 4. Build shared packages + generate Prisma client
npm run build --workspace @msl/types
npm run db:generate

# 5. Run (api on :4000, web on :3000)
npm run dev
```

API health check: <http://localhost:4000/api/v1/health> · Web: <http://localhost:3000>

## Quality gates

```bash
npm run lint        # ESLint (all workspaces)
npm run typecheck   # tsc --noEmit (all workspaces)
npm test            # unit/integration tests
```

CI (`.github/workflows/ci.yml`) runs install → prisma generate → build types →
lint → typecheck → test on every push/PR.
