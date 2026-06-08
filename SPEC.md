# Mongolian Sign Language Interactive Platform — Technical Specification

> **Source:** "Монгол дохионы хэлний интерактив платформ" project brief v1.0 (Grand Amber Group LLC, 2026.06)
> **Prepared as:** Engineering-ready technical specification (senior architect review)
> **Status:** v1 spec for implementation. Items marked 🔶 are gaps/assumptions the spec resolves with a recommended decision — confirm with stakeholders before/around build.

## 0. How to use this document with Claude Code

This is the single source of truth for the build. Recommended workflow:

1. Confirm or adjust the 🔶 decisions in §3 and Appendix B (these are choices the brief left open).
2. Have Claude Code scaffold the project per §9 (architecture) and §16 (MVP build order).
3. Build data model from §7, then APIs from §8, then screens from §6, feature by feature in roadmap order (§15).
4. Treat the requirement IDs (FR-xx / NFR-xx) as your acceptance-test checklist.

The UI language is **Mongolian (Cyrillic)**; this spec is written in English for engineering. Where a UI label matters, the Mongolian text is given in parentheses.

---

## 1. Project Overview

A web platform (mobile-first, responsive) serving deaf / hard-of-hearing children, their teachers, parents, and the broader sign-language community. Four logical pillars:

1. **Verified dictionary** — searchable, video-first Mongolian Sign Language (MSL) entries.
2. **Community contribution** — users submit new words; nothing goes public unverified.
3. **Teacher verification (approval workflow)** with automatic **duplicate detection**.
4. **Gamified learning** — quiz / matching / memory / levels / points / daily challenge, using **virtual avatars only (no children's faces)**.

Plus an **admin/analytics dashboard** and strong **accessibility, privacy, and child-protection** requirements.

**Primary pilot:** School #29 (special-needs school). Initial content target: **800–1,000 approved words** including science packs (chemistry, physics, biology, math).
**Timeline:** ~3 months build/pilot + 1 year maintenance by Grand Amber Group.

**Designed-in for scale (not MVP):** multi-school, mobile app, offline mode, Elasticsearch search.

---

## 2. Requirements

### 2.1 Functional Requirements

Explicit IDs from the brief's Appendix 1 are preserved (FR-01…FR-07). Derived requirements from §4–6 of the brief are added as FR-08+.

| ID | Requirement | Acceptance criterion |
|----|-------------|----------------------|
| FR-01 | Search the dictionary by word text | Typing shows matching words; selecting one shows its sign video/image + explanation |
| FR-02 | Submit a new-word request | Word + explanation + topic + media attached → entry created in `pending` state |
| FR-03 | Automatic duplicate detection on submission | If a matching word exists, no new teacher notification is created; user is shown the existing entry ("this word is already registered") |
| FR-04 | Teacher verification of submissions | Approve / reject / edit work; decision timestamp + reviewer recorded |
| FR-05 | Games run off the approved word bank | Approved words feed quiz / matching / memory modes |
| FR-06 | Admin dashboard | Shows total words, pending requests, approved words, duplicate count |
| FR-07 | Protect minors' personal data | Minor users' personal data never shown in public areas |
| FR-08 | Browse dictionary by topic/category | Hierarchical topics (e.g. Science → Chemistry); filter by topic, level, age group |
| FR-09 | Word detail view | Shows lemma, definition, topic, level, primary sign video, image, usage example, status, variants |
| FR-10 | Sign **variants** per word | A word may have multiple regional/version signs, each labelled as a "version" (хувилбар) |
| FR-11 | Teacher "request clarification" action | Sends submission back to contributor with a comment; status `needs_clarification` |
| FR-12 | Word editing | Teacher/admin can edit an entry's fields and media; changes versioned |
| FR-13 | Approved words published to public dictionary | Only `approved` entries appear publicly; classified by topic/level/age group |
| FR-14 | Track learning usage per word/user | Record views, plays, correct-answer rate; drive progress |
| FR-15 | Quiz mode | Multiple-choice over approved words (sign→word / word→sign) with scoring |
| FR-16 | Matching mode | Match words to signs; scored |
| FR-17 | Memory-card mode | Pair signs/words; scored |
| FR-18 | Levels, points, badges | User accrues points, advances levels, earns badges/achievements |
| FR-19 | Daily challenge | A daily word set / task with streak tracking |
| FR-20 | Topical science word packs | Pre-seeded packs: chemistry, physics, biology, math (and AI terms) |
| FR-21 | Review notifications for teachers | New verifiable submission → teacher notification; **suppress duplicate notifications** (FR-03 rule) |
| FR-22 | Batch approval & priority queue | Teacher can approve in batches; queue prioritization to reduce workload (risk mitigation §9 of brief) |
| FR-23 | Audit log & version history | Every word/explanation change logs source, editor, and timestamp |
| FR-24 | Media consent capture | Capture/track consent for any media; policy that no child face/PII is published |
| FR-25 | Reports | Approved-word %, rejected/duplicate request report, usage statistics |
| FR-26 | Feedback / survey collection | Collect student & teacher feedback (pilot ratings + comments) |
| FR-27 | Keyboard navigation throughout | All interactive flows operable via keyboard |
| FR-28 | Role-based access | Distinct capabilities for learner, contributor, teacher, admin |
| FR-29 | User registration & profile | Account creation; learner profile showing level, points, badges, progress |
| FR-30 | "My submissions" tracking | Contributor can see status of their submitted words |

### 2.2 Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Accessibility | WCAG 2.2 **AA**; deaf-first: never rely on audio-only cues; captions/visual-first; large touch targets; high contrast; keyboard operable |
| NFR-02 | Responsiveness | Mobile-first responsive web; usable on phones, tablets, desktop |
| NFR-03 | Performance (media) | Video compression + thumbnails; CDN/object storage delivery; lazy loading; target word-detail interactive < 2.5s on 3G-class connection |
| NFR-04 | Security | RBAC, audit log, encrypted secrets, signed URLs for private media, input validation, rate limiting |
| NFR-05 | Privacy & child protection | No publication of minors' PII or faces; consent records; data minimization; data-retention & deletion policy 🔶 |
| NFR-06 | Data governance | Versioning + provenance (source, verifier, date) on every entry |
| NFR-07 | Reliability / Ops | Daily automated backups; monitoring/alerting; documented restore; defined RPO/RTO 🔶 |
| NFR-08 | Scalability | Schema and storage designed for multi-school, more words, future mobile/offline without redesign |
| NFR-09 | Maintainability | Open standards, typed code, automated tests, CI; 1-year maintenance handover |
| NFR-10 | Internationalization | UI strings externalized (i18n) even if Mongolian-only at launch |
| NFR-11 | Browser support | Latest 2 versions of Chrome, Edge, Safari, Firefox; iOS Safari & Android Chrome 🔶 |
| NFR-12 | Auditability | Auth and content actions logged with actor, time, before/after |

### 2.3 Constraints & Assumptions

- **C-1** Tech direction from brief: React/Next.js front end, Node.js back end, PostgreSQL, cloud object storage, Postgres full-text search now / Elasticsearch later.
- **C-2** MVP timeline is tight (6–8 weeks dev). Scope discipline is critical; offline/mobile/Elasticsearch are explicitly out of MVP.
- **C-3** Children must not appear in any media; **virtual avatars** are used in games.
- **A-1** Pilot scale is small (one school, ≤ a few hundred users) — design for correctness and accessibility first, heavy scale second (but don't preclude it).

---

## 3. Gap Analysis — Missing / Ambiguous Requirements

The brief is strong on intent but leaves engineering-critical decisions unspecified. Each gap below has a **recommended default** so Claude Code can proceed; flag any you want to change.

| # | Gap | Why it matters | 🔶 Recommended decision |
|---|-----|----------------|--------------------------|
| G-1 | **How do children log in?** Minors typically have no email. | Auth model depends on this. | Teacher/admin **provisions learner accounts** (username + class code or simple PIN). No self-registration for minors; no email required for learners. Parents/teachers self-register with email. |
| G-2 | **Who may contribute words?** "students/parents/grammar-knowing users" is broad. | Anti-spam + content quality. | Any authenticated user can submit; submissions always go through teacher approval. Add rate limiting + minimal abuse reporting. |
| G-3 | **Search is text-only** — a deaf user may not know the written Mongolian word. | Core usability for target audience. | MVP: text + topic browse + visual topic tiles. Backlog: search by handshape/category facets; sign-image grid browsing. |
| G-4 | **Duplicate-detection algorithm undefined.** | FR-03 is central. | MVP: normalized exact-match + trigram fuzzy match (Postgres `pg_trgm`) on the lemma, scoped by topic; threshold configurable. Media similarity is backlog. |
| G-5 | **Spaced-repetition / "daily repetition" logic undefined.** | Drives FR-14/FR-19 learning value. | Implement a simple SM-2-style scheduler (`UserWordProgress.next_review_at`). Daily challenge = due words + new words from chosen pack. |
| G-6 | **Notification channels unspecified.** | FR-21. | MVP: **in-app** notifications only; optional email digest for teachers (config flag). No push in MVP. |
| G-7 | **Video upload constraints undefined.** | Storage, performance, moderation. | Accept MP4/WebM, ≤ 60s, ≤ 50 MB; server-side transcode to web-optimized MP4 + generate poster thumbnail; reject others. |
| G-8 | **Data retention / deletion policy missing** despite privacy emphasis. | Legal + NFR-05. | Define: learner accounts and media deletable on request; soft-delete + 30-day purge; consent withdrawal removes media. Confirm with stakeholders. |
| G-9 | **Level / age-group / topic taxonomies not enumerated.** | Needed for classification. | Provide seed taxonomy (Appendix A). Editable by admin. |
| G-10 | **Performance & scale targets absent.** | NFR sign-off. | Set pilot targets: 200 concurrent users, p95 API < 400ms (non-media), backups daily, RPO 24h / RTO 4h. |
| G-11 | **Content moderation beyond teacher approval** (abusive submissions, comments). | Safety. | Submissions are private until approved (so no public exposure of raw input). Add admin ability to ban users and purge submissions. No free-text public comments in MVP. |
| G-12 | **Multi-school not in MVP but data must not preclude it.** | Avoid rework (NFR-08). | Include nullable `school_id` on users/entities from day 1; single default school for pilot. |
| G-13 | **Bulk import of science word packs** not specified. | Seeding 800–1,000 words by hand is infeasible. | Provide an admin CSV/JSON bulk-import tool that creates `pending` or pre-`approved` entries (admin-only). |
| G-14 | **Email verification / password reset / lockout** not specified. | Account security. | Standard email verification + reset for email accounts; lockout after N failed logins; rate-limited. |
| G-15 | **Captions/text language for videos** not specified. | Accessibility for deaf users (text matters most). | Every word entry must have text definition + example; video captions optional. Visual/text-first is mandatory; audio never required. |

---

## 4. User Roles & Permissions (RBAC)

Roles (least → most privileged). RBAC is a hard requirement (NFR-04).

| Role | Mongolian | Who | Core capabilities |
|------|-----------|-----|-------------------|
| `guest` | Зочин | Unauthenticated | Browse + search public (approved) dictionary; play games as guest (no progress saved) |
| `learner` | Сурагч | Provisioned students | All guest abilities + saved progress, levels, points, badges, daily challenge, profile |
| `contributor` | Хувь нэмэр оруулагч | Parents/community/teachers | All learner abilities + submit word requests, view own submissions, attach media |
| `teacher` | Багш / зөвлөх | School #29 reviewers | All contributor abilities + review queue, approve/reject/edit/request-clarification, batch approve |
| `admin` | Админ | Grand Amber ops | Full access: user mgmt, topic mgmt, word CRUD, bulk import, reports, audit log, consent records, system settings |

**RBAC matrix (representative):**

| Capability | guest | learner | contributor | teacher | admin |
|------------|:--:|:--:|:--:|:--:|:--:|
| Browse/search approved dictionary | ✅ | ✅ | ✅ | ✅ | ✅ |
| Save game progress | ❌ | ✅ | ✅ | ✅ | ✅ |
| Submit word request | ❌ | ❌ | ✅ | ✅ | ✅ |
| View own submissions | ❌ | ❌ | ✅ | ✅ | ✅ |
| Review queue / approve / reject / edit | ❌ | ❌ | ❌ | ✅ | ✅ |
| Batch approval | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage users / roles | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage topics & taxonomy | ❌ | ❌ | ❌ | ❌ | ✅ |
| Bulk import words | ❌ | ❌ | ❌ | ❌ | ✅ |
| View reports & analytics | ❌ | ❌ | ❌ | partial (own) | ✅ |
| View audit log | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage consent records | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 5. Authentication & Authorization

| ID | Requirement |
|----|-------------|
| AUTH-01 | **Token strategy:** JWT access token (short-lived, ~15 min) + rotating refresh token (httpOnly secure cookie). |
| AUTH-02 | **Email accounts** (contributor/teacher/admin): email + password, with email verification and password reset. |
| AUTH-03 | **Learner accounts** (minors): provisioned by teacher/admin — username + class code or PIN; **no email required**; cannot be self-registered (G-1). |
| AUTH-04 | **Password policy:** min 8 chars, complexity check, hashed with bcrypt/argon2; never logged. |
| AUTH-05 | **Brute-force protection:** rate limiting + lockout after N failed attempts (G-14). |
| AUTH-06 | **RBAC enforcement** server-side on every endpoint (middleware), not just UI hiding. |
| AUTH-07 | **Session/audit:** log login, logout, role changes, failed logins with actor + IP + timestamp (NFR-12). |
| AUTH-08 | **Optional SSO (backlog):** Google OAuth for parents/teachers. |
| AUTH-09 | **Media authorization:** private/pending media served via short-lived signed URLs; approved media may be public/CDN-cached. |
| AUTH-10 | **Consent gating:** uploading media requires an associated consent record (NFR-05, FR-24). |
| AUTH-11 | **Minor-data rule:** any endpoint returning user data must strip minors' PII for non-admin/non-owner requesters (FR-07). |

---

## 6. Information Architecture — Pages / Screens

Grouped by audience. (P = public/guest, L = learner, C = contributor, T = teacher, A = admin.)

### Public / Auth
| # | Screen | Roles | Key elements |
|---|--------|-------|--------------|
| S-01 | Landing / Home | P+ | Value prop, search bar, featured topics, login/register CTAs, accessibility statement |
| S-02 | Login | P | Email-or-username login; class-code/PIN path for learners |
| S-03 | Register (email accounts) | P | Email, password, role intent (parent/teacher request), consent checkbox, email verification |
| S-04 | Forgot / reset password | P | Email-based reset |
| S-05 | Accessibility & help | P+ | WCAG statement, how-to, contact |

### Dictionary & Contribution
| # | Screen | Roles | Key elements |
|---|--------|-------|--------------|
| S-06 | Dictionary browse | P+ | Topic tiles (visual-first), level/age filters, alphabetical index |
| S-07 | Search results | P+ | Live results, fuzzy matches, "did you mean", topic facets |
| S-08 | Word detail | P+ | Primary sign video (large), image, text definition + example, topic/level/age, variant switcher, status badge |
| S-09 | Submit word request | C+ | Form: word, definition, topic, example, media upload (video/image), live duplicate hint (FR-03) |
| S-10 | My submissions | C+ | List with status (pending/approved/rejected/needs_clarification/duplicate) + teacher comments |

### Games & Learning
| # | Screen | Roles | Key elements |
|---|--------|-------|--------------|
| S-11 | Games hub | P+/L | Mode tiles (quiz, matching, memory), pack selector, daily challenge entry |
| S-12 | Quiz play | P+/L | Sign↔word MCQ, timer optional, big buttons, virtual avatar |
| S-13 | Matching play | P+/L | Drag/tap to pair words↔signs |
| S-14 | Memory cards play | P+/L | Flip-and-pair grid |
| S-15 | Daily challenge | L | Due + new words; streak counter |
| S-16 | Game results | P+/L | Score, correct %, words to review, replay |
| S-17 | Learner profile / progress | L+ | Level, points, badges, mastery per topic, streaks |
| S-18 | Leaderboard (optional/backlog) | L+ | Per-class ranking (privacy-aware: display names only) |
| S-19 | Accessibility settings | L+ | Contrast, text size, motion-reduction, captions toggle |

### Teacher
| # | Screen | Roles | Key elements |
|---|--------|-------|--------------|
| S-20 | Review queue | T,A | Pending submissions, priority sort, batch-select, duplicate flags |
| S-21 | Submission review detail | T,A | Side-by-side proposed entry + duplicate candidates; approve/reject/edit/request-clarification + comment |
| S-22 | Word editor | T,A | Edit fields + media; manage variants; version note |
| S-23 | Teacher dashboard | T,A | My reviewed count, pending count, recent decisions |
| S-24 | Notifications | L,C,T,A | In-app notification center |

### Admin
| # | Screen | Roles | Key elements |
|---|--------|-------|--------------|
| S-25 | Admin dashboard | A | KPIs: total words, pending, approved, duplicates, active users, game sessions (FR-06) |
| S-26 | User management | A | CRUD users, assign roles, provision learner accounts/class codes, ban/suspend |
| S-27 | Topic / taxonomy management | A | CRUD topics (hierarchical), levels, age groups |
| S-28 | Word management | A | Full word CRUD, archive, variants, status overrides |
| S-29 | Bulk import | A | CSV/JSON upload to seed science packs (G-13) |
| S-30 | Media library | A | Browse/manage assets, storage usage |
| S-31 | Consent records | A | View/manage media consent (FR-24, NFR-05) |
| S-32 | Reports & analytics | A | Approved %, rejected/duplicate report, usage stats, exportable (FR-25) |
| S-33 | Audit log viewer | A | Filterable actor/entity/action history (FR-23) |
| S-34 | System settings | A | Thresholds (dup detection), feature flags, school config |

---

## 7. Data Model — Database Entities (PostgreSQL)

Conventions: `id` = UUID PK; `created_at`/`updated_at` timestamps on all tables; soft-delete via `deleted_at` where noted; FK names end `_id`. `school_id` is nullable everywhere for future multi-school (G-12).

### Identity & access
- **schools** — `id, name, type, contact, created_at`. (Seed: School #29.)
- **users** — `id, school_id?, role (enum: learner|contributor|teacher|admin), display_name, username?, email?, email_verified_at?, password_hash?, pin_hash?, is_minor (bool), status (active|suspended|deleted), locale, last_login_at, created_at, deleted_at?`.
- **class_codes** — `id, school_id, code, label, created_by, expires_at?` (for learner provisioning, G-1).
- **refresh_tokens** — `id, user_id, token_hash, expires_at, revoked_at?, user_agent, ip`.
- **consents** — `id, subject_user_id?, guardian_user_id?, scope (media_publish|data_processing), document_ref?, signed_at, revoked_at?` (FR-24, NFR-05).

### Dictionary content
- **topics** — `id, parent_id?, name, slug, description?, icon?, sort_order` (hierarchical: Science→Chemistry).
- **levels** — `id, code, label, sort_order` (seed taxonomy, Appendix A).
- **age_groups** — `id, code, label, min_age?, max_age?`.
- **words** — `id, school_id?, lemma, normalized_lemma (for dedup), definition, example_sentence?, topic_id, level_id?, age_group_id?, status (draft|pending|approved|rejected|archived), source?, view_count, created_by, approved_by?, approved_at?, current_version, created_at, updated_at, deleted_at?`.
  - Unique-ish guard via `normalized_lemma + topic_id` used by duplicate detection (G-4), `pg_trgm` index on `normalized_lemma`.
- **word_variants** — `id, word_id, label (e.g. "regional/version"), description?, region?, is_primary (bool), created_by, created_at` (FR-10).
- **word_versions** — `id, word_id, version_no, snapshot (jsonb), changed_by, change_note?, created_at` (version history, FR-23/NFR-06).
- **media_assets** — `id, owner_type (word|word_variant|submission), owner_id, type (video|image|thumbnail), storage_provider, storage_key, public_url?, mime, size_bytes, duration_ms?, width?, height?, checksum, consent_id?, uploaded_by, created_at`.

### Contribution & review
- **submissions** — `id, school_id?, submitted_by, proposed_lemma, normalized_lemma, proposed_definition, example_sentence?, topic_id?, level_id?, age_group_id?, status (pending|approved|rejected|needs_clarification|duplicate), duplicate_of_word_id?, resulting_word_id?, created_at, updated_at`.
- **submission_media** — link table submission→media_assets (or use media_assets.owner_type=submission).
- **reviews** — `id, submission_id, reviewer_id, action (approve|reject|edit|request_clarification), comment?, before_snapshot (jsonb)?, after_snapshot (jsonb)?, created_at` (FR-04/FR-11).
- **duplicate_checks** — `id, submission_id, candidate_word_id, method (exact|trigram|topic), similarity_score, decision (matched|distinct), created_at` (FR-03/G-4).

### Learning & gamification
- **game_sessions** — `id, user_id?, guest_token?, mode (quiz|matching|memory), topic_id?, level_id?, score, correct_count, total_count, duration_ms, started_at, ended_at?`.
- **game_items** — `id, session_id, word_id, prompt_type (sign_to_word|word_to_sign|pair), user_answer?, is_correct, response_time_ms`.
- **user_word_progress** — `id, user_id, word_id, times_seen, times_correct, times_incorrect, mastery_level, ease_factor, interval_days, last_reviewed_at, next_review_at` (SM-2 scheduler, G-5).
- **daily_challenges** — `id, date, topic_id?, word_ids (jsonb/array), config`.
- **user_streaks** — `id, user_id, current_streak, longest_streak, last_active_date`.
- **badges** — `id, code, name, description, icon, criteria (jsonb)`.
- **user_badges** — `id, user_id, badge_id, earned_at`.

### Platform / ops
- **notifications** — `id, user_id, type (review_pending|clarification|approved|rejected|system), payload (jsonb), read_at?, created_at` (FR-21; dedup rule enforced in service layer).
- **audit_logs** — `id, actor_id?, entity_type, entity_id, action, before (jsonb)?, after (jsonb)?, ip?, created_at` (FR-23/NFR-12).
- **feedback** — `id, user_id?, category, rating (1–5)?, comment?, context (jsonb)?, created_at` (FR-26).
- **settings** — `id, key, value (jsonb), updated_by, updated_at` (dup-detection thresholds, feature flags, S-34).
- **import_jobs** — `id, created_by, source_filename, total_rows, success_rows, error_rows, errors (jsonb), status, created_at` (bulk import, G-13).

**Entity relationship summary:** users 1—* submissions —* reviews; submissions —1 word (on approval); words 1—* variants, 1—* versions, 1—* media; words *—1 topic/level/age_group; users *—* words via user_word_progress; game_sessions 1—* game_items; everything writes audit_logs.

---

## 8. API Specification — Endpoints

REST/JSON. Base path `/api/v1`. All mutating endpoints require auth + RBAC; all return standard error envelope. Pagination via `?page&limit`; filtering via query params.

### Auth
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | /auth/register | guest | Email-account signup (parent/teacher) |
| POST | /auth/verify-email | guest | Confirm email token |
| POST | /auth/login | guest | Email/username + password |
| POST | /auth/login/class-code | guest | Learner login via username + class code/PIN |
| POST | /auth/refresh | any | Rotate refresh token |
| POST | /auth/logout | any | Revoke refresh token |
| POST | /auth/forgot-password | guest | Trigger reset email |
| POST | /auth/reset-password | guest | Complete reset |
| GET | /auth/me | any | Current user profile + role |

### Users & admin
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | /users | admin | List/filter users |
| POST | /users | admin | Create user / provision learner |
| PATCH | /users/:id | admin | Update role/status |
| DELETE | /users/:id | admin | Soft-delete user (privacy) |
| POST | /class-codes | teacher,admin | Create class code |
| GET | /class-codes | teacher,admin | List class codes |

### Dictionary (public read)
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | /words | guest+ | List/search approved words (`?q&topic&level&age&page`) (FR-01/FR-08) |
| GET | /words/:id | guest+ | Word detail incl. variants + media (FR-09) |
| GET | /words/:id/variants | guest+ | List variants (FR-10) |
| GET | /words/:id/versions | teacher,admin | Version history (FR-23) |
| POST | /words | admin | Create word directly |
| PATCH | /words/:id | teacher,admin | Edit word (FR-12) |
| POST | /words/:id/variants | teacher,admin | Add variant |
| DELETE | /words/:id | admin | Archive/soft-delete |
| GET | /topics | guest+ | Topic tree |
| POST/PATCH/DELETE | /topics/:id | admin | Manage taxonomy (S-27) |
| GET | /levels, /age-groups | guest+ | Taxonomy lookups |

### Submissions & review
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | /submissions | contributor+ | Submit new word (FR-02); triggers dup-check (FR-03) |
| GET | /submissions/mine | contributor+ | My submissions + status (FR-30) |
| GET | /submissions | teacher,admin | Review queue (`?status&priority`) (FR-22) |
| GET | /submissions/:id | teacher,admin | Submission + duplicate candidates |
| POST | /submissions/:id/approve | teacher,admin | Approve → create word (FR-04) |
| POST | /submissions/:id/reject | teacher,admin | Reject + comment |
| POST | /submissions/:id/request-clarification | teacher,admin | Send back (FR-11) |
| POST | /submissions/:id/edit | teacher,admin | Edit then approve |
| POST | /submissions/batch-approve | teacher,admin | Batch approval (FR-22) |
| GET | /submissions/check-duplicate?lemma= | contributor+ | Live duplicate hint for the form (FR-03) |

### Media
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | /media/upload-url | contributor+ | Get signed upload URL (validates type/size, G-7) |
| POST | /media | contributor+ | Register uploaded asset + consent ref (AUTH-10) |
| GET | /media/:id | role-aware | Signed/public URL (AUTH-09) |
| DELETE | /media/:id | admin | Remove asset |

### Games & progress
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| POST | /games/sessions | guest+ | Start session (mode, topic) (FR-15–17) |
| POST | /games/sessions/:id/answers | guest+ | Submit answer item |
| POST | /games/sessions/:id/finish | guest+ | Finish + score (FR-14) |
| GET | /games/daily-challenge | learner+ | Today's challenge (FR-19) |
| GET | /me/progress | learner+ | Mastery, levels, points (FR-18) |
| GET | /me/badges | learner+ | Earned badges |
| GET | /leaderboard | learner+ | Optional/backlog (S-18) |

### Notifications, feedback, reports, audit
| Method | Path | Role | Purpose |
|--------|------|------|---------|
| GET | /notifications | any auth | List (FR-21) |
| POST | /notifications/:id/read | any auth | Mark read |
| POST | /feedback | any | Submit feedback/survey (FR-26) |
| GET | /admin/dashboard | admin | KPI summary (FR-06) |
| GET | /admin/reports/* | admin | Approved %, duplicates, usage (FR-25) |
| GET | /admin/audit-logs | admin | Filtered audit (FR-23) |
| POST | /admin/imports | admin | Bulk word import (G-13) |
| GET/PATCH | /admin/settings | admin | Thresholds/flags (S-34) |
| GET | /admin/consents | admin | Consent records (FR-24) |

---

## 9. System Architecture & Tech Stack

```
[ Browser (Next.js, React, Tailwind) ]
        | HTTPS (JWT access + refresh cookie)
        v
[ API: Node.js (NestJS or Express+TS) ]
   |        |            |              |
   v        v            v              v
[Postgres] [Object    [Transcode    [In-app
 + pg_trgm  storage    worker/queue   notifications]
 + FTS      + CDN]     (ffmpeg)]
```

| Layer | Choice (per brief) | Notes |
|-------|--------------------|-------|
| Front end | **Next.js + React + TypeScript**, Tailwind | Mobile-first, SSR for SEO/perf, i18n built in (NFR-02/10) |
| Back end | **Node.js + TypeScript** (NestJS recommended for RBAC/structure; Express acceptable) | REST API, middleware-based RBAC (AUTH-06) |
| DB | **PostgreSQL** | `pg_trgm` + full-text search for MVP dedup/search (G-4); Elasticsearch deferred |
| ORM | Prisma or TypeORM | Migrations + typed schema |
| Media | Cloud object storage + **CDN**; signed URLs | Transcode pipeline (ffmpeg worker) → MP4 + poster (G-7/NFR-03) |
| Jobs | Queue (BullMQ/Redis) | Transcode, bulk import, email digests |
| Auth | JWT + refresh, bcrypt/argon2 | RBAC enforced server-side |
| Observability | Structured logs, error tracking, uptime monitor | NFR-07 |
| CI/CD | Lint, typecheck, tests, automated deploy | NFR-09 |
| Backups | Daily Postgres dump + media bucket versioning | RPO 24h / RTO 4h (G-10) |

---

## 10. Key Workflows

**A. Word submission & approval (FR-02→FR-04, the platform's core):**
1. Contributor fills form (S-09); `GET /submissions/check-duplicate` runs live as they type the lemma.
2. On submit: media uploaded via signed URL (consent attached), `submission` created `pending`.
3. Server runs duplicate detection (exact + trigram, topic-scoped). If a strong match exists → mark `duplicate`, link `duplicate_of_word_id`, show user the existing word, and **suppress** the teacher notification (FR-03/FR-21).
4. Otherwise → create teacher notification, place in review queue (priority sort).
5. Teacher opens S-21, sees proposed entry + duplicate candidates, chooses approve / reject / edit / request-clarification (logged to `reviews` + `audit_logs`).
6. On approve → create/publish `word` (`approved`), classify by topic/level/age, write `word_version`, notify contributor.

**B. Duplicate detection (G-4):** normalize lemma → exact match check → `pg_trgm` similarity within same topic → score against configurable threshold (S-34). Record every comparison in `duplicate_checks`.

**C. Game + progress loop (FR-14/FR-18/FR-19):** start session over approved words (optionally a pack) → serve items using `user_word_progress` due-dates (SM-2) + new words → record correctness/time → update progress, points, streaks, badges → results screen suggests words to review.

---

## 11. Accessibility (NFR-01, WCAG 2.2 AA — deaf-first)

- **No audio-only information** anywhere; all cues visual/textual.
- Every word entry **must** have a text definition + example (video may lack captions but text is mandatory) (G-15).
- Large touch targets (≥ 44px), high-contrast theme, adjustable text size, reduced-motion option (S-19).
- Full **keyboard navigation** and visible focus states (FR-27).
- Semantic HTML + ARIA; meaningful alt text on images; captions toggle for any video that has them.
- Forms: clear labels, inline validation, error text not color-only.
- Test with axe/Lighthouse + manual keyboard pass each release.

## 12. Security, Privacy & Child Protection

- RBAC server-side on every route; deny by default.
- **Minors:** no email, no public PII, no faces in media; games use virtual avatars only (FR-07/C-3).
- Consent record required before any media is publishable (FR-24/AUTH-10); consent withdrawal removes media (G-8).
- Private/pending media via short-lived signed URLs; only approved media is CDN-public (AUTH-09).
- Soft-delete + scheduled purge; data-export/delete on request (G-8).
- Input validation + output encoding (XSS), parameterized queries (SQLi), CSRF protection on cookie auth, rate limiting on auth + submissions (G-2/G-14).
- Secrets in a vault/env, never in code; audit log on sensitive actions (NFR-12).

## 13. Analytics & Metrics (maps to brief §8)

Track and surface on admin dashboard (FR-06/FR-25): approved word count (target 800–1,000); per-topic science-pack counts; active learners; teacher reviews handled; game sessions + correct-answer %; satisfaction (feedback ratings); duplicate requests detected + teacher notifications suppressed. Define a lightweight event taxonomy (page_view, word_view, game_start/answer/finish, submission_created/approved) feeding the dashboard.

## 14. Non-Functional / Ops

Daily automated backups; monitoring + alerting; documented restore drill; RPO 24h / RTO 4h (G-10); p95 non-media API < 400ms; word-detail interactive < 2.5s on slow connection (NFR-03); 1-year maintenance handover with runbook (NFR-07/09).


## 15. Development Roadmap

Mapped to the brief's phases (§7), expressed as deliverable milestones.

| Phase | Duration (brief) | Deliverables | Exit criteria |
|-------|------------------|--------------|---------------|
| **0. Setup & design** | 2–3 wks | Repo, CI, env, schema migrations, Next.js + API scaffold, RBAC skeleton, UX wireframes, taxonomy seed, confirm 🔶 decisions | Architecture agreed; clickable wireframes; empty app deploys |
| **1. MVP core** | 6–8 wks | Auth (email + learner provisioning), dictionary browse/search (FR-01/08/09), word detail (incl. variants), submission + media upload (FR-02/10), duplicate detection (FR-03), teacher review queue + approve/reject/edit/clarify (FR-04/11/12), basic admin dashboard (FR-06), audit log + versioning (FR-23), notifications (FR-21) | Working web prototype; a word can be submitted → deduped → reviewed → published |
| **2. Gamified module** | 4–6 wks | Quiz/matching/memory (FR-15–17), points/levels/badges (FR-18), daily challenge + SM-2 progress (FR-14/19), science packs + bulk import (FR-20/G-13), accessibility settings (S-19) | Children can learn/repeat words via games off the approved bank |
| **3. Pilot @ School #29** | 4 wks | Deploy, seed 800–1,000 words, onboard teachers/learners, collect feedback (FR-26) | Real usage data + prioritized improvement list |
| **4. Polish & demo** | 2–3 wks | Feedback fixes, reports/analytics (FR-25), demo package, impact summary | Demo-day build + impact report |
| **5. Maintenance** | 1 yr | Bug fixes, backups, monitoring, support (Grand Amber) | Stable operation; runbook handover |
| **6. Scale-up (backlog)** | +3–9 mo | More words/schools, mobile app, offline mode, Elasticsearch, leaderboard, sign-based search, OAuth | Scale roadmap |

**Critical path & risks:** the submission→dedup→approval pipeline (Phase 1) is the highest-value, highest-risk piece — build it first and end-to-end before games. Keep Elasticsearch, mobile, and offline strictly out of MVP to protect the 3-month window (C-2).

## 16. Suggested MVP Build Order for Claude Code

Hand these to Claude Code as sequential tasks; each ends with tests + a runnable state.

1. **Scaffold** monorepo (Next.js web + Node/TS API), TypeScript, lint, Prisma, Docker compose (Postgres + Redis), CI.
2. **Schema & migrations** for all §7 entities; seed `schools` (#29), taxonomy (Appendix A), one admin user.
3. **Auth & RBAC**: register/verify/login/refresh/logout, learner class-code login, RBAC middleware, `/auth/me`.
4. **Topics + taxonomy API/admin** (CRUD).
5. **Words read API + dictionary UI**: list/search (`pg_trgm` + FTS), word detail, variants, topic browse (S-06/07/08).
6. **Media upload**: signed URLs, type/size validation, transcode worker, consent linkage.
7. **Submissions + duplicate detection** API + submit form with live dup hint (S-09); `submissions/mine`.
8. **Review workflow**: queue, review detail with dup candidates, approve/reject/edit/clarify, batch approve; notifications + suppression rule; versioning + audit log.
9. **Admin dashboard** KPIs + reports + bulk import + consent records + settings.
10. **Games**: session engine, quiz → matching → memory, scoring, `user_word_progress` (SM-2), daily challenge, points/levels/badges, accessibility settings.
11. **Feedback** capture + accessibility audit pass (axe/Lighthouse) + hardening (rate limits, validation) + backup/monitoring setup.

For each task: implement → unit/integration tests → verify against the FR/NFR acceptance criteria above → commit.

---

## Appendix A — Seed Taxonomies (editable by admin)

**Levels:** `beginner` (Анхан), `elementary` (Бага), `intermediate` (Дунд), `advanced` (Ахисан).
**Age groups:** `under7`, `7-10`, `11-14`, `15plus` (align to school grades; confirm with School #29).
**Topic tree (initial):**
- Daily / Everyday (Өдөр тутам): greetings, family, food, time, emotions
- School (Сургууль): classroom, subjects, stationery
- Science (Шинжлэх ухаан): **Chemistry** (Хими), **Physics** (Физик), **Biology** (Биологи), **Math** (Математик), AI/Tech terms
- Nature (Байгаль): animals, weather, plants
- Numbers & fingerspelling (Тоо ба хурууны үсэг)

## Appendix B — Open questions to confirm with stakeholders

1. Learner login mechanism — class code vs PIN vs teacher-managed passwords? (G-1)
2. Who may become a contributor — open registration or teacher-approved? (G-2)
3. Data retention & deletion policy for minors' accounts and media. (G-8)
4. Duplicate-match threshold and whether topic-scoping is acceptable. (G-4)
5. Are video captions required or optional per entry? (G-15)
6. Target device/browser matrix and minimum connection assumptions. (NFR-11/G-10)
7. Confirm age-group/level taxonomy against School #29 grade structure. (G-9)
8. Email digests for teachers in MVP, or in-app only? (G-6)
9. Source/licensing relationship with the existing mnsl.mn dictionary — any content reuse?

---

*Spec generated from the v1.0 project brief. FR/NFR IDs are the acceptance checklist. 🔶 items require a stakeholder decision; defaults are provided so development can proceed without blocking.*
