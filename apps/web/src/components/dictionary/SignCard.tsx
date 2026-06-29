import Link from 'next/link';
import type { Route } from 'next';
import { Skeleton } from '@msl/ui';
import { getServerT } from '@/i18n/server';
import type { WordListItem } from '@/lib/dictionary/types';
import { wordDisplayName } from '@/lib/dictionary/display';
import { SignCardVideo } from './SignCardVideo';

export async function SignCard({
  word,
  index,
}: {
  word: WordListItem;
  index: number;
}): Promise<React.ReactElement> {
  const t = await getServerT();
  const displayName = wordDisplayName(word.lemma, word.variants);
  return (
    <Link
      href={`/dictionary/${word.id}` as Route}
      aria-label={t('dict.openWord', { lemma: displayName })}
      className="glass group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none"
    >
      <SignCardVideo src={word.video?.url ?? null} />

      <div className="relative z-[6] flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-tight text-fg">
          <span className="tabular-nums text-fg-subtle">{index}.</span> {displayName}
        </h3>
      </div>
    </Link>
  );
}

export function SignCardSkeleton(): React.ReactElement {
  return (
    <div className="glass flex h-full flex-col overflow-hidden">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="relative z-[6] flex-1 space-y-2 px-4 pb-4 pt-3.5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
