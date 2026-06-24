import type { Metadata } from 'next';
import { ClipboardList, PlusCircle, SearchCheck, BookOpenCheck, Info } from 'lucide-react';
import { getServerT } from '@/i18n/server';
import { SubmitForm } from '@/components/submissions/SubmitForm';
import { AuthTrigger } from '@/components/auth/AuthTrigger';
import { getSession } from '@/lib/auth/session';
import { apiGetSafe, TAXONOMY_READ } from '@/lib/api/server';
import type { TaxoRef, TopicNode } from '@/lib/dictionary/types';

export const metadata: Metadata = { title: 'Үг санал болгох' };

/** Post-submission explainer steps (FR-02 review workflow), icon + i18n copy. */
const AFTER_STEPS = [
  { icon: ClipboardList, titleKey: 'submit.after.s1.title', bodyKey: 'submit.after.s1.body' },
  { icon: SearchCheck, titleKey: 'submit.after.s2.title', bodyKey: 'submit.after.s2.body' },
  { icon: BookOpenCheck, titleKey: 'submit.after.s3.title', bodyKey: 'submit.after.s3.body' },
] as const;

export default async function SubmitWordPage(): Promise<React.ReactElement> {
  const t = await getServerT();
  const [session, topics, ageGroups, handednesses] = await Promise.all([
    getSession(),
    apiGetSafe<TopicNode[]>('/topics', TAXONOMY_READ),
    apiGetSafe<TaxoRef[]>('/age-groups', TAXONOMY_READ),
    apiGetSafe<TaxoRef[]>('/handedness', TAXONOMY_READ),
  ]);

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-accent-ink">
          <PlusCircle aria-hidden className="h-7 w-7" />
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent-ink">
          {t('submit.eyebrow')}
        </span>
        <h1 className="text-balance text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t('submit.title')}
        </h1>
        <p className="text-pretty text-lg leading-relaxed text-fg-muted">{t('submit.subtitle')}</p>
      </header>

      {session.role === 'guest' ? (
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 rounded-2xl border border-info/30 bg-info-subtle px-4 py-3 text-center text-sm text-fg">
          <Info aria-hidden className="h-5 w-5 shrink-0 text-info" />
          <span>{t('submit.guestHint')}</span>{' '}
          <AuthTrigger view="login" className="font-semibold text-primary underline underline-offset-2">
            {t('nav.login')}
          </AuthTrigger>
          <span aria-hidden className="text-fg-subtle">
            ·
          </span>
          <AuthTrigger view="register" className="font-semibold text-primary underline underline-offset-2">
            {t('nav.register')}
          </AuthTrigger>
        </p>
      ) : null}

      {/* Form card */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
        <h2 className="sr-only">{t('submit.formTitle')}</h2>
        <SubmitForm
          isAuthenticated={session.role !== 'guest'}
          topics={topics ?? []}
          ageGroups={ageGroups ?? []}
          handednesses={handednesses ?? []}
        />
      </section>

      {/* "What happens after you submit?" help section */}
      <section
        aria-labelledby="after-submit-title"
        className="mt-6 rounded-2xl border border-border bg-surface-muted p-5 shadow-sm sm:p-7"
      >
        <h2 id="after-submit-title" className="text-lg font-bold tracking-tight text-fg">
          {t('submit.after.title')}
        </h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {AFTER_STEPS.map(({ icon: Icon, titleKey, bodyKey }, i) => (
            <li key={titleKey} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-subtle text-accent-ink">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              <p className="text-sm font-bold text-fg">
                <span className="text-fg-subtle">{i + 1}.</span> {t(titleKey)}
              </p>
              <p className="text-sm leading-relaxed text-fg-muted">{t(bodyKey)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-fg-muted">{t('submit.after.note')}</p>
      </section>
    </main>
  );
}
