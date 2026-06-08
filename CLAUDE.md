# CLAUDE.md — Mongolian Sign Language Interactive Platform

> Project conventions and guardrails. **SPEC.md is the source of truth.** The
> FR-xx / NFR-xx IDs in SPEC.md are the acceptance checklist. This file tells you
> *how* we build; SPEC.md tells you *what*.

## What this is

A web platform for **deaf / hard-of-hearing children**, teachers, and parents in
Mongolia. Four pillars: verified MSL video dictionary, community word submission,
teacher approval workflow with automatic duplicate detection, and gamified learning
with **virtual avatars only**. Pilot: School #29. Target: 800–1,000 approved words.

## Non-negotiables (read every session)

### Accessibility — WCAG 2.2 AA, deaf-first (NFR-01)
- **Never rely on audio-only cues.** All information must be visual/textual.
- Every word entry **must** have a text definition + example. Video captions optional;
  text is mandatory (G-15).
- Keyboard-operable everywhere; visible focus states (FR-27).
- Touch targets ≥ 44px; high-contrast theme; adjustable text size; reduced-motion option.
- Semantic HTML + ARIA; meaningful alt text; errors conveyed by text, never color alone.
- Each release: axe + Lighthouse + a manual keyboard pass.

### Child safety & privacy (FR-07, FR-24, NFR-05, C-3)
- **No children's faces or PII in any media, ever.** Games use virtual avatars only.
- Minors have no email; their PII is never shown in public areas or to
  non-admin/non-owner requesters (AUTH-11).
- Media is unpublishable without a consent record (AUTH-10). Consent withdrawal
  removes the media (G-8).
- Soft-delete + scheduled purge; data export/delete on request.

### Security (NFR-04, §12)
- **RBAC enforced server-side on every endpoint** via middleware/guards — deny by
  default. UI hiding is not access control.
- JWT access + rotating refresh (httpOnly secure cookie). Passwords hashed with
  argon2/bcrypt, never logged. Lockout + rate limiting on auth & submissions.
- Parameterized queries (Prisma), input validation, output encoding, CSRF protection
  on cookie auth, signed URLs for private/pending media.
- Secrets only in env/vault — never hardcoded. Audit log on sensitive actions (NFR-12).

## Tech stack (fixed by §9 — do not deviate)

| Layer | Choice |
|-------|--------|
| Frontend | Next.js + React + TypeScript + Tailwind, i18n (Mongolian Cyrillic) |
| Backend | NestJS (Node + TypeScript), REST under `/api/v1` |
| DB | PostgreSQL + `pg_trgm` + full-text search |
| ORM | Prisma (migrations checked in) |
| Media | Object storage + CDN, signed URLs; ffmpeg transcode worker |
| Jobs | BullMQ + Redis |
| Auth | JWT + rotating refresh, argon2/bcrypt |
| Local infra | Docker Compose (Postgres + Redis) |

**Explicitly OUT of MVP — do not add:** Elasticsearch, mobile app, offline mode,
push notifications, public free-text comments, OAuth/SSO. (C-2, G-6, G-11)

## Repo layout (monorepo)

```
msl-platform/
  apps/
    web/        # Next.js frontend
    api/        # NestJS backend
    worker/     # BullMQ transcode/import/email worker (may live under api/)
  packages/
    types/      # shared TS types / DTOs / Zod schemas
    ui/         # design system: tokens + Tailwind preset + a11y primitives
    config/     # shared eslint/tsconfig/prettier
  prisma/       # schema.prisma, migrations, seed
  docker-compose.yml
  .env.example
```

## Coding standards

- **Strict TypeScript** everywhere (`strict: true`, no implicit `any`). No `any` in
  committed code without a justifying comment.
- ESLint + Prettier; CI fails on lint/typecheck/test errors.
- **i18n from day one** — no hardcoded user-facing strings. All UI text via i18n keys,
  default locale Mongolian (`mn`).
- Validate all input at the API boundary (class-validator / Zod DTOs).
- Every list endpoint paginates (`?page&limit`); every mutation is RBAC-guarded and
  audit-logged where sensitive.
- Standard error envelope on all API responses.
- Tests live next to code (`*.spec.ts`) or in `test/`; write unit + integration tests
  per build step and make them pass before committing.

## Commands (verified — Step 1)

```bash
# First-time setup
cp .env.example .env
npm install
npm run build --workspace @msl/types   # build shared types before api/web
npm run db:generate                    # prisma generate

# Infra
docker compose up -d                   # Postgres + Redis (run locally; not in sandbox)
# DB (Step 2+)
npm run db:migrate                     # prisma migrate dev
npm run db:seed                        # seed school/taxonomy/admin
# Dev
npm run dev                            # web (:3000) + api (:4000) via concurrently
npm run dev:web
npm run dev:api
# Quality (all delegate to workspaces)
npm run lint
npm run typecheck
npm run test
npm run test:e2e --workspace @msl/api
```

Health check: `GET http://localhost:4000/api/v1/health`.
Design-system preview: `http://localhost:3000/design-system` (all primitives + tokens +
RBAC role-switcher). `@msl/ui` is consumed as source (Next `transpilePackages`), no build.
Note: build `@msl/types` (and `db:generate`) before typechecking api/web from a cold
checkout — they consume its compiled output / the generated Prisma client.

> **Keep this section current.** After each build step, update with the exact run
> command so the app is always runnable from a cold checkout.

## Workflow per build step (§16)

1. Implement end-to-end (API + UI where relevant).
2. Write unit/integration tests; make them pass.
3. Verify against the relevant FR/NFR acceptance criteria in SPEC.md.
4. Tick the box in PLAN.md.
5. Commit with a clear message referencing the step + FR/NFR IDs.
6. Leave the app runnable (document the command), then pause and report.

## Decisions & assumptions

Open 🔶 items use the spec's §3 recommended defaults, all recorded in
**ASSUMPTIONS.md**. Do not invent requirements beyond SPEC.md; if something is
genuinely undefined, add it to ASSUMPTIONS.md and flag it.

## Git

- Branch off `main`; commit/push only when asked.
- Conventional, clear messages referencing build step and FR/NFR IDs.
