import type { Metadata } from 'next';
import { getServerT } from '@/i18n/server';
import { RuleSection } from '@/components/rules/RuleSection';
import { RulesNav } from '@/components/rules/RulesNav';

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
      <header className="mx-auto max-w-3xl space-y-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t('rules.structure.title')}
        </h1>
        <p className="text-lg text-fg-muted">{t('rules.structure.lead')}</p>
      </header>

      <div className="mt-8">
        <RulesNav />
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
