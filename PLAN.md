# PLAN.md — MVP Build Order (SPEC §16)

Sequential build order. Each step ends with **tests passing**, **FR/NFR verified**,
**a runnable app**, and a **commit**. Check boxes as steps complete. The
submission → duplicate-detection → teacher-approval pipeline (steps 6–8) is the
highest-value, highest-risk path and is built before any games.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Step 1 — Scaffold ✅
- [x] Monorepo (apps/web Next.js, apps/api NestJS, packages/types, packages/config)
- [x] Strict TypeScript, ESLint, Prettier wired across workspaces
- [x] Prisma initialized (generator + datasource, `pg_trgm` extension; full schema = Step 2)
- [x] Docker Compose: Postgres + Redis
- [x] `.env.example` with all config keys (no secrets)
- [x] CI: install → prisma generate → build types → lint → typecheck → test
- [x] Empty web + api boot; health check endpoint (`GET /api/v1/health`)
- **Verify:** ✅ typecheck/lint/test green (api 2 unit + 1 e2e, web 5 i18n); api + web
  production builds succeed. ⚠️ `docker compose up` not runnable in this sandbox
  (Docker CLI absent) — compose file validated by inspection; run locally to confirm.

## Step 2 — Schema, migrations & seed ✅
- [x] Prisma schema for ALL §7 entities (identity, dictionary, contribution/review,
      learning/gamification, platform/ops); `school_id` nullable everywhere (G-12)
- [x] `pg_trgm` extension + GIN trigram index on `words.normalized_lemma` (powers dedup,
      G-4). FTS (tsvector) query config lands with the Dictionary read slice (Phase C-3).
- [x] Initial migration checked in (`prisma/migrations/0_init`)
- [x] Seed: School #29, taxonomy (Appendix A: levels, age groups, topic tree), admin,
      dup-threshold setting
- **Verify:** ✅ `prisma validate` clean; client generates; migration has pg_trgm +
  trigram GIN index; NFR-06 versioning/provenance fields present (`word_versions`,
  `words.source/approved_by/approved_at/current_version`). ⚠️ live `migrate deploy`/`db:seed`
  require Postgres (not runnable in this sandbox — run locally). **Commit.**

## Step 3 — Auth & RBAC
- [ ] register / verify-email / login / refresh / logout (AUTH-01/02/04)
- [ ] Learner class-code/PIN login (AUTH-03, G-1); no self-registration for minors
- [ ] RBAC guard/middleware enforced server-side on every route (AUTH-06, deny by default)
- [ ] `GET /auth/me`
- [ ] Password policy, lockout, rate limiting (AUTH-04/05, G-14)
- [ ] Auth/audit logging: login, logout, role change, failed login (AUTH-07, NFR-12)
- **Verify:** FR-28, FR-29, AUTH-01..11; RBAC integration tests per role. **Commit.**

## Step 4 — Topics + taxonomy API/admin
- [ ] `GET /topics` (tree), `GET /levels`, `GET /age-groups`
- [ ] Admin CRUD for topics (hierarchical), levels, age groups (S-27)
- **Verify:** FR-08 taxonomy; admin-only enforcement. **Commit.**

## Step 5 — Words read API + dictionary UI
- [ ] `GET /words` list/search (`?q&topic&level&age&page`) via pg_trgm + FTS (FR-01/08)
- [ ] `GET /words/:id` detail incl. variants + media (FR-09)
- [ ] `GET /words/:id/variants` (FR-10)
- [ ] Only `approved` words public (FR-13)
- [ ] UI: dictionary browse w/ topic tiles (S-06), search results (S-07), word detail (S-08)
- [ ] Minor-PII stripping on any user data returned (AUTH-11, FR-07)
- **Verify:** FR-01/08/09/10/13; word-detail interactive perf target (NFR-03). **Commit.**

## Step 6 — Media upload
- [ ] `POST /media/upload-url` signed upload URL, type/size validation (G-7)
- [ ] `POST /media` register asset + consent ref (AUTH-10, FR-24)
- [ ] `GET /media/:id` role-aware signed/public URL (AUTH-09)
- [ ] Transcode worker (BullMQ + ffmpeg): MP4 + poster thumbnail (NFR-03)
- [ ] Consent gating enforced before publish
- **Verify:** FR-24, AUTH-09/10, NFR-03/05; reject oversize/wrong-type. **Commit.**

## Step 7 — Submissions + duplicate detection
- [ ] `POST /submissions` create `pending` (FR-02), triggers dup-check
- [ ] Duplicate detection: normalized exact + trigram, topic-scoped, configurable
      threshold; record every comparison in `duplicate_checks` (FR-03, G-4)
- [ ] `GET /submissions/check-duplicate?lemma=` live hint (FR-03)
- [ ] `GET /submissions/mine` (FR-30)
- [ ] On strong match → mark `duplicate`, link `duplicate_of_word_id`, show existing word,
      **suppress** teacher notification (FR-03/FR-21)
- [ ] UI: submit form w/ live dup hint (S-09), my submissions (S-10)
- **Verify:** FR-02/03/30; dup suppression test. **Commit.**

## Step 8 — Review workflow
- [ ] `GET /submissions` review queue, priority sort (FR-22)
- [ ] `GET /submissions/:id` w/ duplicate candidates
- [ ] approve / reject / edit / request-clarification (FR-04/11/12)
- [ ] `POST /submissions/batch-approve` (FR-22)
- [ ] On approve → create `approved` word, classify, write `word_version`, notify
      contributor (FR-04, FR-23/NFR-06)
- [ ] Notifications + suppression rule (FR-21); in-app notification center (S-24)
- [ ] Audit log on every review action (FR-23, NFR-12)
- [ ] UI: review queue (S-20), review detail side-by-side (S-21), word editor (S-22),
      teacher dashboard (S-23)
- **Verify:** FR-04/11/12/21/22/23; end-to-end submit→dedup→review→publish. **Commit.**

## Step 9 — Admin dashboard
- [ ] `GET /admin/dashboard` KPIs: total/pending/approved/duplicates (FR-06, S-25)
- [ ] `GET /admin/reports/*` approved %, duplicate, usage (FR-25, S-32)
- [ ] `POST /admin/imports` CSV/JSON bulk import (G-13, S-29)
- [ ] `GET /admin/consents` consent records (FR-24, S-31)
- [ ] `GET/PATCH /admin/settings` thresholds/flags (S-34)
- [ ] `GET /admin/audit-logs` (FR-23, S-33); user management (S-26)
- **Verify:** FR-06/23/24/25; admin-only enforcement. **Commit.**

## Step 10 — Games
- [ ] Session engine: `POST /games/sessions`, `/answers`, `/finish` (FR-14)
- [ ] Quiz (FR-15) → Matching (FR-16) → Memory (FR-17), scored; virtual avatars only
- [ ] `user_word_progress` SM-2 scheduler (G-5, FR-14)
- [ ] Daily challenge + streaks (FR-19)
- [ ] Points / levels / badges (FR-18); `/me/progress`, `/me/badges`
- [ ] Science packs (FR-20)
- [ ] Accessibility settings: contrast, text size, motion, captions (S-19)
- **Verify:** FR-14..20; games run off approved bank only (FR-05). **Commit.**

## Step 11 — Feedback, a11y audit & hardening
- [ ] `POST /feedback` collection (FR-26, S-32)
- [ ] Accessibility audit: axe + Lighthouse + manual keyboard pass (NFR-01)
- [ ] Hardening: rate limits, validation review, CSRF, signed-URL review (NFR-04)
- [ ] Backups + monitoring/alerting setup; documented restore (NFR-07, G-10)
- **Verify:** FR-26, NFR-01/04/07. **Commit.**

---

### Cross-cutting (maintained throughout)
- [ ] i18n: all strings externalized, Mongolian default (NFR-10)
- [ ] Audit logging on auth + content actions (NFR-12)
- [ ] Soft-delete + purge policy honored (G-8)
- [ ] Tests + CI green at every step (NFR-09)

---

## Full-platform build (Phases A–C) — every §6 screen + §8 endpoint

Overlay on the step plan above: deliver the whole platform UI+API. Phase A is
frontend-only (no DB). **Phases B & C require Step 2 (schema/migrations/seed) first.**

### Phase A — Design system ✅ (frontend, no DB)
- [x] `packages/ui`: tokens (AA palette, type scale, radius, elevation, ≥44px touch) +
      Tailwind preset
- [x] A11y primitives: Button, IconButton, Field/Input, Textarea, Select, Dialog, Tabs,
      Toast, Card, Badge/StatusBadge, VideoPlayer (captions toggle, muted, no autoplay
      sound), Table, Pagination, EmptyState, Skeleton, VisuallyHidden — keyboard-operable,
      visible focus, ARIA
- [x] RBAC route-group shells: (public)/(learner)/(teacher)/(admin), each with nav +
      server-side role guard + mobile-first responsive nav
- [x] Deaf-first rules baked in (visual/text-first, video-centric, color never sole signal)
- [x] All strings via i18n (mn default + en parity)
- [x] `/design-system` preview route (tokens + every primitive) + RoleSwitcher
- **Verify:** ✅ typecheck/lint clean; ui 7 + web 5 + api 2 tests pass; `next build` green
  (8 routes). Tokens confirmed in built CSS. ⏸️ **Awaiting design approval before Phase B.**

### Phase B — API foundation ✅ (needs Step 2 schema)
- [x] Error envelope, validation pipe, pagination helper, **global** RBAC guards
      (JwtAuthGuard + RolesGuard, deny-by-default) on every endpoint, audit-log
      interceptor; OpenAPI/Swagger at `/api/docs`
- [x] Auth module: `/auth/*` — register / verify-email / login / login/class-code /
      refresh / logout / forgot-password / reset-password / me; JWT access + rotating
      refresh cookie (SHA-256 hashed, rotated); throttler rate limiting + account lockout
- **Verify:** ✅ typecheck/lint clean; api **23 unit + 1 e2e** pass (RolesGuard rank
  ladder, login lockout/enumeration-safety, token duration parsing); `nest build` green.
  AUTH-01/02/03/04/05/06/07/11, FR-28/29, NFR-04/12 covered. Live auth flows need
  Postgres (run locally). **Commit.**

### Phase C — Vertical slices (API + screens together)
- [x] **1 Auth & onboarding (S-02,03,04)** — login (email + learner class-code tabs),
      register w/ consent, forgot/reset/verify screens wired to `/auth/*` via a Next BFF
      (httpOnly cookies on the web domain + middleware silent refresh); real JWT session
      replaces the Phase A `msl_demo_role` stub; logout in the app shell. **Verify:** ✅
      web typecheck/lint clean, 15 web tests, `next build` green; **browser E2E (Playwright):
      admin login → `/admin`, RBAC guard passes, session persists on reload, wrong password →
      localized error.** FR-28/29, AUTH-02/03 covered.
- [x] **2 Topics/taxonomy (S-27)** — `GET /topics` (tree), `/levels`, `/age-groups`
      (public); admin CRUD for all three (deny-by-default `@Roles('admin')`); admin S-27
      manager screen (tree + create/delete, levels/age-group create). Reusable server API
      helper (`lib/api/server.ts`) added. **Verify:** 27 api tests (tree builder), web
      typecheck/lint/build green.
- [x] **3 Dictionary read (S-06,07,08)** — `GET /words` (search over lemma/definition +
      normalized_lemma via pg_trgm GIN, topic/level/age filters, pagination), `/words/:id`
      (detail + variants + media, view-count increment), `/words/:id/variants`; approved-only
      (FR-13); no creator PII (AUTH-11). Screens: browse w/ topic tiles + filters + search,
      results grid + pager, word detail (deaf-first VideoPlayer + mandatory text). **Verify:**
      API smoke-tested live (list/detail/search/no-match); web typecheck/lint/build green.
- [x] **4 Media upload + consent** — `POST /media/upload-url` (validates type/size, G-7),
      `POST /media` (multipart upload → local storage + register), `GET /media/:id`
      (role-aware: public for approved content, short-lived signed token otherwise, AUTH-09),
      `GET /media/:id/blob` (serve), `DELETE /media/:id` (admin), `POST /consents` (AUTH-10).
      Pluggable StorageService (local driver; S3 in prod). **Verify:** live smoke — upload,
      signed URL, blob 403-without-token / 200-with-token; 35 api tests. ⚠️ ffmpeg transcode
      worker deferred (sandbox has no ffmpeg/Redis) — documented in ASSUMPTIONS.
- [x] **5 Submissions + dedup (S-09,10, CRITICAL PATH)** — `POST /submissions` (creates
      pending, runs dedup), `GET /submissions/check-duplicate` (live hint), `GET
      /submissions/mine` (FR-30). Dedup = normalized exact + pg_trgm trigram, topic-scoped,
      configurable threshold (settings/S-34); every comparison recorded in `duplicate_checks`;
      strong match → `duplicate` + `duplicate_of_word_id` + **suppressed** reviewer
      notification (FR-03/FR-21). Screens: submit form w/ live dup hint + optional media+consent,
      my-submissions w/ status + teacher comment. **Verify:** live E2E — exact/fuzzy → duplicate,
      distinct → pending; **2 duplicates + 1 distinct ⇒ exactly 1 reviewer notification**
      (suppression proven); 41 api tests (decideDuplicate). FR-02/03/30.
- [ ] 6 Review workflow (S-20–23) + approve/reject/edit/clarify + batch + notifications
- [ ] 7 Admin (S-25,26,28–34) + `/admin/*` (KPIs, reports, bulk import, users, consent, settings)
- [ ] 8 Games (S-11–17) + `/games/*` + SM-2 progress + points/levels/badges + daily challenge
- [ ] 9 Notifications/feedback/a11y settings (S-19,24) + remaining endpoints
- [ ] 10 Hardening — axe/Lighthouse, security review, seed, README
