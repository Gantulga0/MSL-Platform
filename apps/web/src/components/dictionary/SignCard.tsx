import Link from 'next/link';
import type { Route } from 'next';
import { Skeleton } from '@msl/ui';
import { translate as t } from '@/i18n';
import type { WordListItem } from '@/lib/dictionary/types';
import { SignCardVideo } from './SignCardVideo';

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
      className="glass group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none"
    >
      {/* Sign-video thumbnail — fixed aspect, plays on hover / when in view (touch). */}
      <SignCardVideo src={word.video?.url ?? null} handCount={word.handCount} />

      {/* Body grows to fill so every card in a row is the same height; the title
          is clamped to one line and the tags to one row, keeping cards uniform. */}
      <div className="relative z-[6] flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <h3 className="truncate font-display text-lg font-bold leading-tight text-fg">
          <span className="tabular-nums text-fg-subtle">{index}.</span> {word.lemma}
        </h3>
        <div className="mt-2.5 flex flex-nowrap items-center gap-1.5 overflow-hidden">
          {word.topic && <span className="tagm tagm-topic">{word.topic.name}</span>}
          {word.level && <span className="tagm tagm-level">{word.level.label}</span>}
        </div>
      </div>
    </Link>
  );
}

/** Loading placeholder mirroring SignCard's shape (paired with an SR status). */
export function SignCardSkeleton(): React.ReactElement {
  return (
    <div className="glass flex h-full flex-col overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="relative z-[6] flex-1 space-y-2 px-4 pb-4 pt-3.5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
