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

## Step 2 — Schema, migrations & seed
- [ ] Prisma schema for ALL §7 entities (identity, dictionary, contribution/review,
      learning/gamification, platform/ops); `school_id` nullable everywhere (G-12)
- [ ] `pg_trgm` extension + index on `words.normalized_lemma`; FTS config
- [ ] Initial migration checked in
- [ ] Seed: School #29, taxonomy (Appendix A: levels, age groups, topic tree), one admin
- **Verify:** migrate + seed run clean; NFR-06 (versioning/provenance fields present).
  **Commit.**

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
