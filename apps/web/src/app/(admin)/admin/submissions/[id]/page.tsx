import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, CardBody, CardTitle } from '@msl/ui';
import { getServerT } from '@/i18n/server';
import { apiGet, apiGetSafe, ApiClientError, TAXONOMY_READ } from '@/lib/api/server';
import { ReviewDecision } from '@/components/review/ReviewDecision';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';

export const metadata: Metadata = { title: 'Саналыг хянах' };

interface SubmissionDetail {
  id: string;
  proposedLemma: string;
  proposedDefinition: string;
  exampleSentence: string | null;
  status: string;
  topic: { id: string; name: string } | null;
  level: { id: string; label: string } | null;
  ageGroup: { id: string; label: string } | null;
  handCount: number | null;
  submitter: { displayName: string; isMinor: boolean } | null;
  reviews: { action: string; comment: string | null; createdAt: string; reviewer: { displayName: string } | null }[];
  media: { id: string; type: string; mime: string }[];
}

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const t = await getServerT();
  const { id } = await params;
  const [submission, topics, levels, ageGroups, handednesses] = await Promise.all([
    // 404 → not-found; any other failure rethrows to error.tsx instead of
    // masking an outage as a missing submission.
    apiGet<SubmissionDetail>(`/admin/submissions/${id}`).catch((e: unknown) => {
      if (e instanceof ApiClientError && e.status === 404) return null;
      throw e;
    }),
    apiGetSafe<TopicNode[]>('/topics', TAXONOMY_READ),
    apiGetSafe<TaxoRef[]>('/levels', TAXONOMY_READ),
    apiGetSafe<TaxoRef[]>('/age-groups', TAXONOMY_READ),
    apiGetSafe<TaxoRef[]>('/handedness', TAXONOMY_READ),
  ]);
  if (!submission) notFound();

  // Submission media is private — fetch a short-lived signed URL for the video so
  // the reviewer can watch it before deciding (AUTH-09).
  const videoMedia = submission.media.find((m) => m.type === 'video') ?? null;
  const video = videoMedia
    ? await apiGetSafe<{ url: string; mime: string }>(`/media/${videoMedia.id}`)
    : null;

  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href={'/admin/submissions' as Route}
        className="mb-4 inline-flex items-center gap-1 text-sm text-primary underline"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        {t('review.back')}
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">{t('review.detailTitle')}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardBody className="space-y-3">
            <CardTitle>{t('review.proposed')}</CardTitle>
            <h2 className="text-xl font-semibold text-fg">{submission.proposedLemma}</h2>
            <div>
              <p className="text-sm font-medium text-fg-muted">{t('review.definition')}</p>
              <p className="text-fg">{submission.proposedDefinition}</p>
            </div>
            {submission.exampleSentence && (
              <div>
                <p className="text-sm font-medium text-fg-muted">{t('review.example')}</p>
                <p className="text-fg">{submission.exampleSentence}</p>
              </div>
            )}
            <p className="text-sm text-fg-subtle">
              {t('review.topic')}: {submission.topic?.name ?? '—'} ·{' '}
              {t('review.age')}: {submission.ageGroup?.label ?? '—'} ·{' '}
              {t('review.handCount')}:{' '}
              {submission.handCount
                ? t(submission.handCount === 1 ? 'dict.handsOne' : 'dict.handsTwo')
                : '—'}
            </p>
            <p className="text-sm text-fg-subtle">
              {t('review.submittedBy')}: {submission.submitter?.displayName}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <CardTitle>{t('review.video')}</CardTitle>
            {video ? (
              <video
                controls
                playsInline
                preload="metadata"
                src={video.url}
                className="aspect-video w-full rounded-md bg-black"
              >
                {t('review.noVideo')}
              </video>
            ) : (
              <p className="text-fg-muted">{t('review.noVideo')}</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardBody>
            <ReviewDecision
              submissionId={submission.id}
              topics={topics ?? []}
              levels={levels ?? []}
              ageGroups={ageGroups ?? []}
              handednesses={handednesses ?? []}
              defaultTopicId={submission.topic?.id ?? ''}
              defaultLevelId={submission.level?.id ?? ''}
              defaultAgeGroupId={submission.ageGroup?.id ?? ''}
              defaultHandCount={submission.handCount}
            />
          </CardBody>
        </Card>
      </div>

      {submission.reviews.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-fg">{t('review.history')}</h2>
          <ul className="space-y-1 text-sm text-fg-muted">
            {submission.reviews.map((r, i) => (
              <li key={i}>
                <span className="font-medium text-fg">{r.action}</span>
                {r.reviewer ? ` · ${r.reviewer.displayName}` : ''}
                {r.comment ? ` — ${r.comment}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
