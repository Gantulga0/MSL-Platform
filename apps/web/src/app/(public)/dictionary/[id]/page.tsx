import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getServerT } from '@/i18n/server';
import { apiGet, ApiClientError } from '@/lib/api/server';
import type { WordDetail } from '@/lib/dictionary/types';
import { SignPlayer } from '@/components/dictionary/SignPlayer';
import { WordDetailTabs } from '@/components/dictionary/WordDetailTabs';

export const metadata: Metadata = { title: 'Үг' };

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const t = await getServerT();
  const { id } = await params;
  // 404 → not-found page; any other failure → rethrow so error.tsx handles it
  // (rather than masking an outage as "word doesn't exist").
  const word = await apiGet<WordDetail>(`/words/${id}`).catch((e: unknown) => {
    if (e instanceof ApiClientError && e.status === 404) return null;
    throw e;
  });
  if (!word) notFound();

  const video = word.media.find((m) => m.type === 'video' && m.publicUrl);
  const poster = word.media.find((m) => m.type === 'thumbnail' && m.publicUrl)?.publicUrl ?? undefined;

  // CATEGORY = parent topic; TAG = the child topic (only when it has a parent).
  const category = word.topic?.parent?.name ?? word.topic?.name ?? null;
  const tag = word.topic?.parent ? word.topic.name : null;

  // Hand attributes shown as images (handedness only).
  const attributes = [
    ...(word.handedness ? [{ ...word.handedness, group: t('dict.hands') }] : []),
  ].filter((a) => a.imageUrl);

  // The primary variant's region badges the player (if any).
  const primaryVariant = word.variants.find((v) => v.isPrimary) ?? word.variants[0];
  const handLabel =
    word.handCount === 1
      ? t('dict.handsOne')
      : word.handCount === 2
        ? t('dict.handsTwo')
        : null;

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href={'/dictionary' as Route}
        className="mb-4 inline-flex min-h-touch items-center gap-1 rounded-full px-3 text-sm font-semibold text-accent-ink hover:bg-surface-muted"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        {t('dict.back')}
      </Link>

      {/* Split: player on the LEFT, info + tabs on the RIGHT (G-15: text always present). */}
      <div className="glass grid gap-5 p-3.5 lg:grid-cols-[1fr_1.05fr] lg:gap-8">
        <div className="relative z-[6]">
          <SignPlayer
            src={video?.publicUrl ?? null}
            poster={poster}
            label={`${word.lemma} — ${t('dict.video')}`}
            region={primaryVariant?.region ?? null}
          />
        </div>

        <div className="relative z-[6] flex flex-col px-1 pb-2 pt-1">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-fg">{word.lemma}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {category && <span className="tagm tagm-topic">{category}</span>}
            {tag && <span className="tagm">#{tag}</span>}
            {handLabel && <span className="tagm">{handLabel}</span>}
            {word.level && <span className="tagm tagm-level">{word.level.label}</span>}
            {word.ageGroup && <span className="tagm">{word.ageGroup.label}</span>}
          </div>

          {!video?.publicUrl && !word.definition && !word.exampleSentence && (
            <p className="mt-4 text-fg-muted">🎬 {t('dict.noMedia')}</p>
          )}

          <WordDetailTabs
            definition={word.definition}
            exampleSentence={word.exampleSentence}
            variants={word.variants}
            attributes={attributes}
          />
        </div>
      </div>
    </main>
  );
}
