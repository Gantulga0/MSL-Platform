import type { Metadata } from 'next';
import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Badge, Card, CardBody, CardTitle } from '@msl/ui';
import { translate } from '@/i18n';
import { apiGetSafe } from '@/lib/api/server';
import { ReviewDecision } from '@/components/review/ReviewDecision';
import type { TopicNode } from '@/lib/dictionary/types';

export const metadata: Metadata = { title: 'Саналыг хянах' };

interface SubmissionDetail {
  id: string;
  proposedLemma: string;
  proposedDefinition: string;
  exampleSentence: string | null;
  status: string;
  topic: { id: string; name: string } | null;
  submitter: { displayName: string; isMinor: boolean } | null;
  reviews: { action: string; comment: string | null; createdAt: string; reviewer: { displayName: string } | null }[];
  duplicateChecks: {
    method: string;
    similarityScore: number;
    decision: string;
    candidate: { id: string; lemma: string; definition: string } | null;
  }[];
  media: { id: string; type: string; mime: string }[];
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const [submission, topics] = await Promise.all([
    apiGetSafe<SubmissionDetail>(`/submissions/${id}`),
    apiGetSafe<TopicNode[]>('/topics'),
  ]);
  if (!submission) notFound();

  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-8">
      <Link href={'/review' as Route} className="mb-4 inline-flex items-center gap-1 text-sm text-primary underline">
        <ArrowLeft aria-hidden className="h-4 w-4" />
        {translate('review.back')}
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-fg">{translate('review.detailTitle')}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Proposed entry */}
        <Card>
          <CardBody className="space-y-3">
            <CardTitle>{translate('review.proposed')}</CardTitle>
            <h2 className="text-xl font-semibold text-fg">{submission.proposedLemma}</h2>
            <div>
              <p className="text-sm font-medium text-fg-muted">{translate('review.definition')}</p>
              <p className="text-fg">{submission.proposedDefinition}</p>
            </div>
            {submission.exampleSentence && (
              <div>
                <p className="text-sm font-medium text-fg-muted">{translate('review.example')}</p>
                <p className="text-fg">{submission.exampleSentence}</p>
              </div>
            )}
            <p className="text-sm text-fg-subtle">
              {translate('review.topic')}: {submission.topic?.name ?? '—'} ·{' '}
              {translate('review.submittedBy')}: {submission.submitter?.displayName}
            </p>
            {submission.media.length > 0 && (
              <p className="text-sm text-fg-subtle">
                {translate('review.media')}: {submission.media.length}
              </p>
            )}
          </CardBody>
        </Card>

        {/* Duplicate candidates (S-21 side-by-side) */}
        <Card>
          <CardBody className="space-y-3">
            <CardTitle>{translate('review.duplicates')}</CardTitle>
            {submission.duplicateChecks.length === 0 ? (
              <p className="text-fg-muted">{translate('review.noDuplicates')}</p>
            ) : (
              <ul className="space-y-2">
                {submission.duplicateChecks.map((d, i) => (
                  <li key={i} className="rounded-md border border-border p-2">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/dictionary/${d.candidate?.id}` as Route}
                        className="font-medium text-primary underline"
                      >
                        {d.candidate?.lemma}
                      </Link>
                      <Badge tone={d.decision === 'matched' ? 'warning' : 'neutral'}>
                        {translate('review.similarity')}: {Math.round(d.similarityScore * 100)}%
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{d.candidate?.definition}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Decision */}
      <div className="mt-6">
        <Card>
          <CardBody>
            <ReviewDecision
              submissionId={submission.id}
              needsTopic={!submission.topic}
              topics={topics ?? []}
            />
          </CardBody>
        </Card>
      </div>

      {/* History */}
      {submission.reviews.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-semibold text-fg">{translate('review.history')}</h2>
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
