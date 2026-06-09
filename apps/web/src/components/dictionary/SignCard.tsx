import Link from 'next/link';
import type { Route } from 'next';
import { ArrowUpRight, Hand } from 'lucide-react';
import { Badge, Skeleton } from '@msl/ui';
import { translate as t } from '@/i18n';
import type { WordListItem } from '@/lib/dictionary/types';

/**
 * A single sign in the dictionary grid (S-06). White card floating on cream:
 * a sign-video thumbnail with the numbered word label beneath (e.g. "29. ээж").
 * The whole card is one link to the word detail (where the video plays) — no
 * audio is ever required (deaf-first). Hover/focus lift the card; focus-visible
 * ring is handled globally. The list payload carries no media, so the thumbnail
 * is a captioned placeholder until a thumbnail URL is added to /words.
 */
export function SignCard({
  word,
  index,
}: {
  word: WordListItem;
  /** 1-based running number across the paginated result set. */
  index: number;
}): React.ReactElement {
  return (
    <Link
      href={`/dictionary/${word.id}` as Route}
      aria-label={t('dict.openWord', undefined, { lemma: word.lemma })}
      className="group block rounded-xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
    >
      {/* Sign-video thumbnail (placeholder until list media is wired). */}
      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-tint-sage">
        <div className="flex h-full w-full items-center justify-center">
          <Hand aria-hidden className="h-10 w-10 text-accent-ink/70" />
        </div>
        <span className="absolute bottom-2 left-2 rounded-full bg-surface/85 px-2 py-0.5 text-xs font-medium text-fg-muted">
          {t('dict.video')}
        </span>
        <span
          aria-hidden
          className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/85 text-fg transition-colors group-hover:bg-primary group-hover:text-fg-on-primary"
        >
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </div>

      <div className="flex items-start justify-between gap-2 px-4 py-3">
        <h3 className="text-base font-semibold text-fg">
          <span className="tabular-nums text-fg-subtle">{index}.</span> {word.lemma}
        </h3>
        {word.level && <Badge tone="neutral">{word.level.label}</Badge>}
      </div>
      {word.topic && <p className="px-4 pb-3 text-sm text-fg-muted">{word.topic.name}</p>}
    </Link>
  );
}

/** Loading placeholder mirroring SignCard's shape (paired with an SR status). */
export function SignCardSkeleton(): React.ReactElement {
  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <Skeleton className="aspect-video w-full rounded-b-none rounded-t-xl" />
      <div className="space-y-2 px-4 py-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
