import type { Metadata } from 'next';
import { Hand } from 'lucide-react';
import { getServerT } from '@/i18n/server';
import { RuleSection } from '@/components/rules/RuleSection';
import { RulesNav } from '@/components/rules/RulesNav';
import { RuleIndex } from '@/components/rules/RuleIndex';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('rules.structure.title') };
}

const SECTIONS = [
  {
    eyebrowKey: 'rules.structure.s1.eyebrow',
    titleKey: 'rules.structure.s1.title',
    paragraphKeys: ['rules.structure.s1.p1', 'rules.structure.s1.p2'],
    videoSrc: '/videos/rules/structure-1.mp4',
  },
  {
    eyebrowKey: 'rules.structure.s2.eyebrow',
    titleKey: 'rules.structure.s2.title',
    paragraphKeys: [
      'rules.structure.s2.p1',
      'rules.structure.s2.p2',
      'rules.structure.s2.p3',
      'rules.structure.s2.p4',
      'rules.structure.s2.p5',
    ],
    videoSrc: null,
  },
  {
    eyebrowKey: 'rules.structure.s3.eyebrow',
    titleKey: 'rules.structure.s3.title',
    paragraphKeys: [
      'rules.structure.s3.p1',
      'rules.structure.s3.p2',
      'rules.structure.s3.p3',
      'rules.structure.s3.p4',
      'rules.structure.s3.p5',
      'rules.structure.s3.p6',
    ],
    videoSrc: null,
  },
] as const;

export default async function RulesStructurePage(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <header className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-subtle text-accent-ink">
          <Hand aria-hidden className="h-7 w-7" />
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent-ink">
          {t('rules.eyebrow')}
        </span>
        <h1 className="text-balance text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t('rules.structure.title')}
        </h1>
        <p className="text-pretty text-lg leading-relaxed text-fg-muted">{t('rules.structure.lead')}</p>
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
            videoSrc={s.videoSrc}
          />
        ))}
      </div>
    </main>
  );
}
