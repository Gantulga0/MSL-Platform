import type { Metadata } from 'next';
import { Scale } from 'lucide-react';
import { getServerT } from '@/i18n/server';
import { RuleSection } from '@/components/rules/RuleSection';
import { RulesNav } from '@/components/rules/RulesNav';
import { RuleIndex } from '@/components/rules/RuleIndex';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('rules.standard.title') };
}

const SECTIONS = [
  {
    eyebrowKey: 'rules.standard.s1.eyebrow',
    titleKey: 'rules.standard.s1.title',
    paragraphKeys: [
      'rules.standard.s1.p1',
      'rules.standard.s1.p2',
      'rules.standard.s1.p3',
      'rules.standard.s1.p4',
    ],
  },
  {
    eyebrowKey: 'rules.standard.s2.eyebrow',
    titleKey: 'rules.standard.s2.title',
    paragraphKeys: ['rules.standard.s2.p1'],
  },
  {
    eyebrowKey: 'rules.standard.s3.eyebrow',
    titleKey: 'rules.standard.s3.title',
    paragraphKeys: ['rules.standard.s3.p1', 'rules.standard.s3.p2'],
  },
] as const;

export default async function RulesStandardPage(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <header className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-accent-ink">
          <Scale aria-hidden className="h-7 w-7" />
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent-ink">
          {t('rules.eyebrow')}
        </span>
        <h1 className="text-balance text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t('rules.standard.title')}
        </h1>
        <p className="text-pretty text-lg leading-relaxed text-fg-muted">{t('rules.standard.lead')}</p>
      </header>

      <div className="mt-8">
        <RulesNav />
      </div>

      <div className="mx-auto mt-6 max-w-3xl">
        <RuleIndex titleKeys={SECTIONS.map((s) => s.titleKey)} />
      </div>

      <div className="mt-10 space-y-8 sm:space-y-10">
        {SECTIONS.map((s, i) => (
          <RuleSection
            key={s.titleKey}
            index={i + 1}
            eyebrowKey={s.eyebrowKey}
            titleKey={s.titleKey}
            paragraphKeys={[...s.paragraphKeys]}
            // TODO: бодит тайлбар бичлэг нэмэх. Standard ≠ structure-1.mp4 (placeholder).
            videoSrc={null}
          />
        ))}
      </div>
    </main>
  );
}
