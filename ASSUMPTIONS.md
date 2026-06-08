# ASSUMPTIONS.md — 🔶 Defaults Adopted

These are the open (🔶) decisions from SPEC.md §3 / Appendix B. We adopt the spec's
**recommended defaults** so development is never blocked. **Every item here is a flag**
— confirm with stakeholders; changing one should be a localized change, not a redesign.

Legend: ⚠️ = needs stakeholder confirmation before pilot.

---

## Auth & accounts

- **G-1 — Learner login.** ⚠️ Teachers/admins **provision learner accounts**
  (username + class code or simple PIN). No self-registration for minors; no email for
  learners. Parents/teachers self-register with email.
- **G-2 — Who may contribute.** ⚠️ Any authenticated user may submit; all submissions
  pass through teacher approval. Add rate limiting + minimal abuse reporting. (Open
  question: open contributor registration vs teacher-approved.)
- **G-14 — Account security.** Email verification + password reset for email accounts;
  lockout after **5** failed logins (configurable); rate-limited.

## Duplicate detection & search

- **G-4 — Dedup algorithm.** ⚠️ Normalized exact-match + `pg_trgm` trigram fuzzy match
  on the lemma, **scoped by topic**, with a **configurable threshold** (default
  similarity **0.45**, stored in `settings`, tunable in S-34). Media similarity is
  backlog. Topic-scoping assumed acceptable.
- **G-3 — Search modality.** MVP: text search + topic browse + visual topic tiles.
  Handshape/sign-image search is backlog (not in MVP).

## Learning & games

- **G-5 — Spaced repetition.** Simple **SM-2-style** scheduler via
  `user_word_progress.next_review_at`. Daily challenge = due words + new words from the
  chosen pack.

## Media

- **G-7 — Video upload constraints.** Accept **MP4/WebM, ≤ 60s, ≤ 50 MB**;
  server-side transcode to web-optimized MP4 + generated poster thumbnail; reject
  anything else.
- **G-15 — Captions/text.** ⚠️ Every word entry **must** have text definition +
  example. Video captions are **optional** per entry. Visual/text-first mandatory;
  audio never required.

## Privacy, retention, safety

- **G-8 — Data retention/deletion.** ⚠️ Learner accounts and media deletable on
  request; **soft-delete + 30-day purge**; consent withdrawal removes media. Needs
  legal/stakeholder confirmation.
- **G-11 — Content moderation.** Submissions are private until approved (no public
  exposure of raw input). Admin can ban users and purge submissions. **No free-text
  public comments in MVP.**
- **NFR-05 child protection.** No minor PII/faces published; consent records required;
  data minimization (reaffirmed, not optional).

## Notifications

- **G-6 — Channels.** ⚠️ MVP: **in-app notifications only**; optional teacher email
  digest behind a config flag (default **off**). No push in MVP.

## Taxonomy & content

- **G-9 — Taxonomies.** Seed from Appendix A:
  - **Levels:** beginner (Анхан), elementary (Бага), intermediate (Дунд),
    advanced (Ахисан).
  - **Age groups:** ⚠️ under7, 7-10, 11-14, 15plus (confirm vs School #29 grades).
  - **Topics:** Daily/Everyday, School, Science (Chemistry/Physics/Biology/Math/AI),
    Nature, Numbers & fingerspelling. Admin-editable.
- **G-13 — Bulk import.** Admin-only CSV/JSON import creating `pending` or pre-`approved`
  entries (seeding 800–1,000 words by hand is infeasible).

## Multi-school & scale

- **G-12 — Multi-school readiness.** Nullable `school_id` on users/entities from day 1;
  single default school (#29) for pilot. Multi-school not in MVP.
- **G-10 — Performance/scale targets.** ⚠️ Pilot targets: **200 concurrent users**,
  **p95 non-media API < 400ms**, daily backups, **RPO 24h / RTO 4h**.
- **NFR-11 — Browser matrix.** ⚠️ Latest 2 versions of Chrome, Edge, Safari, Firefox;
  iOS Safari + Android Chrome.

## Implementation decisions (design system — Phase A)

- **UI primitive library.** Adopted **Radix UI** (`@radix-ui/react-{dialog,select,tabs,toast}`)
  under the hood for the hardest-to-make-accessible primitives, and **lucide-react**
  for iconography. Rationale: WCAG 2.2 AA + keyboard operability are hard requirements
  (NFR-01); Radix gives focus traps, roving tabindex, ARIA roles and Esc handling for
  free (the shadcn pattern). Simple primitives (Button, Input, Badge, Card, Table,
  Pagination, VideoPlayer, etc.) are hand-rolled. Not a stack deviation — §9 fixes the
  framework, not the component lib. ⚠️ Flag if you'd prefer zero third-party UI deps.
- **Design tokens** live in `packages/ui/src/tokens.ts` and feed a Tailwind preset; all
  text/bg pairs meet ≥ 4.5:1 (normal) / ≥ 3:1 (large/UI). Status is never color-only —
  badges/toasts pair color + icon + text (NFR-01).
- **Demo-role session stub.** Phase A ships `getSession()` reading a `msl_demo_role`
  cookie so the RBAC route-group shells/guards are real and reviewable before auth
  exists. **Replaced wholesale in Phase C** by JWT/refresh-cookie validation — call
  sites (layouts) stay unchanged. A `RoleSwitcher` on `/design-system` sets the cookie.

## Implementation decisions (API foundation & auth — Phase B)

- **Self-registered role.** Email self-registration creates a **`contributor`**
  (parents/community, G-2); `teacher`/`admin` are admin-assigned only. Minors never
  self-register (G-1). Email accounts must verify before first login (AUTH-02).
- **Refresh tokens.** Opaque 48-byte random tokens, stored only as **SHA-256 hashes**
  in `refresh_tokens`, carried in an **httpOnly, SameSite=Lax** cookie, `secure` in
  production. **Rotated on every `/auth/refresh`** (old row revoked); reuse of a
  revoked/expired token is rejected (AUTH-01). All sessions revoked on password reset.
- **Email verify/reset tokens.** Single-use, stored hashed (SHA-256), 24h TTL. Until the
  mail worker exists (G-6), the raw token is **logged in non-production only**; endpoints
  always return generic messages (no account enumeration).
- **Brute-force.** Per-IP rate limiting via `@nestjs/throttler` (global 100/60s; auth
  routes 10/60s) + account lockout after `AUTH_MAX_FAILED_LOGINS` (default 5) for
  `AUTH_LOCKOUT_MINUTES` (default 15) (AUTH-05).
- **RBAC.** Enforced server-side by **global** `JwtAuthGuard` + `RolesGuard`
  (deny-by-default); routes opt out with `@Public()` and raise the bar with
  `@Roles(...)` using the rank ladder in `@msl/types` (AUTH-06). Every mutating request
  is audited by a global interceptor (NFR-12).
- **FTS.** Postgres full-text search (tsvector/query) for the dictionary is implemented
  in the **Dictionary read slice (Phase C-3)**, where it is consumed; Step 2 ships the
  `pg_trgm` extension + trigram GIN index that power duplicate detection (G-4).

## Out of MVP (explicitly excluded, per C-2)

Elasticsearch, mobile app, offline mode, push notifications, OAuth/SSO, public comments,
leaderboard (backlog), sign-based search.

## Open questions with no default yet (Appendix B)

- **#9 — mnsl.mn content/licensing relationship.** ⚠️ No assumption made; do **not**
  reuse external content until licensing is confirmed. All seed content treated as
  placeholder/internally-authored until told otherwise.
