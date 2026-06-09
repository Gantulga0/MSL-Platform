import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Badge, Card, CardBody, VideoPlayer } from '@msl/ui';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';
import type { WordDetail } from '@/lib/dictionary/types';

export const metadata: Metadata = { title: 'Үг' };

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const word = await apiGetSafe<WordDetail>(`/words/${id}`);
  if (!word) notFound();

  const video = word.media.find((m) => m.type === 'video' && m.publicUrl);
  const poster = word.media.find((m) => m.type === 'thumbnail' && m.publicUrl)?.publicUrl ?? undefined;

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={'/dictionary' as Route}
        className="mb-4 inline-flex min-h-touch items-center gap-1 rounded-full px-3 text-sm font-semibold text-accent-ink hover:bg-surface-muted"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        {translate('dict.back')}
      </Link>

      <header className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-fg">{word.lemma}</h1>
        {word.level && <Badge tone="info">{word.level.label}</Badge>}
        {word.ageGroup && <Badge tone="neutral">{word.ageGroup.label}</Badge>}
      </header>

      {/* Deaf-first: video is primary, but text is always present (G-15). */}
      <div className="mb-6">
        {video?.publicUrl ? (
          <VideoPlayer
            src={video.publicUrl}
            poster={poster}
            label={`${word.lemma} — ${translate('dict.video')}`}
            loop
            captionsLabels={{ show: translate('ds.captionsShow'), hide: translate('ds.captionsHide') }}
          />
        ) : (
          <Card>
            <CardBody>
              <p className="text-fg-muted">🎬 {translate('dict.noMedia')}</p>
            </CardBody>
          </Card>
        )}
      </div>

      <section aria-labelledby="def-h" className="mb-6">
        <h2 id="def-h" className="mb-1 text-lg font-semibold text-fg">
          {translate('dict.definition')}
        </h2>
        <p className="text-fg">{word.definition}</p>
      </section>

      {word.exampleSentence && (
        <section aria-labelledby="ex-h" className="mb-6">
          <h2 id="ex-h" className="mb-1 text-lg font-semibold text-fg">
            {translate('dict.example')}
          </h2>
          <p className="text-fg-muted">{word.exampleSentence}</p>
        </section>
      )}

      {word.topic && <p className="mb-6 text-sm text-fg-subtle">{word.topic.name}</p>}

      {word.variants.length > 0 && (
        <section aria-labelledby="var-h">
          <h2 id="var-h" className="mb-2 text-lg font-semibold text-fg">
            {translate('dict.variants')}
          </h2>
          <ul className="space-y-2">
            {word.variants.map((v) => (
              <li key={v.id}>
                <Card>
                  <CardBody>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-fg">{v.label}</span>
                      {v.isPrimary && <Badge tone="success">{translate('ds.variant')}</Badge>}
                      {v.region && <span className="text-sm text-fg-subtle">{v.region}</span>}
                    </div>
                    {v.description && <p className="mt-1 text-fg-muted">{v.description}</p>}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
