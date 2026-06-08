/** Shared domain enums mirroring the Prisma schema (SPEC §7). */

export const WORD_STATUSES = ['draft', 'pending', 'approved', 'rejected', 'archived'] as const;
export type WordStatus = (typeof WORD_STATUSES)[number];

export const SUBMISSION_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'needs_clarification',
  'duplicate',
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const REVIEW_ACTIONS = ['approve', 'reject', 'edit', 'request_clarification'] as const;
export type ReviewAction = (typeof REVIEW_ACTIONS)[number];

export const DUPLICATE_METHODS = ['exact', 'trigram', 'topic'] as const;
export type DuplicateMethod = (typeof DUPLICATE_METHODS)[number];

export const GAME_MODES = ['quiz', 'matching', 'memory'] as const;
export type GameMode = (typeof GAME_MODES)[number];

export const MEDIA_TYPES = ['video', 'image', 'thumbnail'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const NOTIFICATION_TYPES = [
  'review_pending',
  'clarification',
  'approved',
  'rejected',
  'system',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const USER_STATUSES = ['active', 'suspended', 'deleted'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
