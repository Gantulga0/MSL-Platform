# ASSUMPTIONS

Recorded decisions and deviations from SPEC.md, per CLAUDE.md.

## Handshape / position / movement were removed (current)

The handshape, position (SignLocation) and movement (SignMovement) option model
— entities, the `Word`/`Submission` relations, the `WordHandshape` join, the
dictionary filters, admin/review pickers and their seed/option-images — were all
removed (migration `20260611190000_remove_handshape_position_movement`). Only
**handedness** (hand count 1/2), topic, age and level remain as classifiable
attributes. Earlier notes below that mention handshape/position/movement are
historical and no longer apply.

## Word definition is now optional (deviation from G-15)

SPEC G-15 says every word entry must carry a text definition. Per an explicit
product decision, the admin "create word" flow is now **selection-based**
(handshape / position / movement / hand-count image pickers) and no longer asks
for a definition. Consequently:

- `Word.definition` is nullable everywhere (schema, admin form, bulk import).
- Submission approval no longer rejects an empty definition.

If G-15 is reinstated later, restore the definition field + the approval guard
in `admin.service.approveSubmission`.

## Sign attribute options carry an image (А1)

`Handshape`, `SignLocation`, `SignMovement` each gained a nullable `imageUrl`.
Seed values point at `/taxonomy/{handshapes,positions,movements}/<code>.png`
placeholders; drop real artwork at those paths (under `apps/web/public/`) to make
the image pickers render. Hand-count placeholders live at
`/taxonomy/hands/{one,two}.png`. Missing images degrade gracefully to the text
label.

## Handshape is many-to-many (decision)

A word can reference one or more handshapes (a two-handed sign may use a
different shape per hand), stored via the `WordHandshape` join table. Position
and movement remain single-valued.

## Every word must have a video (FR-01 here)

A word/sign cannot exist without a video. Enforced at:
- `admin.createWord` — rejects unless a `video` MediaAsset is attached.
- `submissions.create` — rejects when no `mediaIds`.
- `bulkImport` — each row needs a valid `videoUrl` (per-row error otherwise).
- Frontend: the admin create form's file input is `required`.

There is no `video` column on `Word`; the video is the `MediaAsset`
(`ownerType='word'`, `type='video'`).

## Handedness is an image option mapped to handCount

`Handedness` is an option entity (code/label/imageUrl) but is NOT an FK on Word.
Its `handCount` (1/2) maps onto the existing `Word.handCount`, so the dictionary
`hands` filter is unchanged. The admin handedness picker submits the mapped
count.

## Option images share video storage; served by the API

handshape/position/movement/handedness images live in the same storage as videos
(`apps/api/storage/options/<kind>/`) and are served publicly at
`/api/v1/options/images/<kind>/<file>` (reusing `StorageService`). The web app
proxies `/api/v1/{media,options}/*` to the API via a Next `rewrites()` so the
browser can load them. New options can be uploaded from `/admin/options`.

## Approval requires a full classification

A submission can only be approved once the reviewer sets **all** of: topic, age
group, level, hand count, ≥1 handshape, position and movement (`approveSubmission`
throws `Missing required attributes` otherwise). Because these can only be set on
the submission detail page, the queue's quick-approve and batch-approve actions
were removed — the list links to the detail view instead. (`batchApprove*`
endpoint/action remain but are unused.)

## Public submission requires topic + position

The "suggest a word" form now requires a topic (hierarchical `TopicSelect`) and a
position, alongside the existing Cyrillic-only name + video. `Submission` gained a
`locationId` column (migration `20260611170000_submission_location`) so the
submitter's position is stored and prefilled at review; approval falls back to it
(`dto.locationId ?? submission.locationId`). The Cyrillic-only lemma rule is
unchanged.

## One subtopic + derived parent (CATEGORY / TAG)

A word keeps a single `topicId`. When it's a child topic, the parent is the
CATEGORY and the child is the TAG on the word-detail view — derived via
`topic.parent`, no extra storage. The hierarchical review dropdown
(`TopicSelect`) lets the reviewer pick any node; counts already roll up to the
parent. Multi-subtopic would need a word↔topic join (not done — flagged for
later).

## Handedness image on the detail view

The word-detail view shows the handedness image by looking up the `Handedness`
option whose `handCount` matches the word's (see [[media-options-serving]]).
Handshape/position/movement images come straight from each option's `imageUrl`.

## Bulk-import video is referenced by URL (Г)

Videos are uploaded to storage out-of-band; the import JSON passes only a
`videoUrl`. It is attached via the same `MediaAsset` relation the single-word
flow uses (`ownerType='word'`), with `storageProvider='external'` and the URL as
both `storageKey` and `publicUrl`.
