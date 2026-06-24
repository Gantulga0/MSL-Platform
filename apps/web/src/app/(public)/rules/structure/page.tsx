import type { Metadata } from 'next';
import { Hand } from 'lucide-react';
import { getServerT } from '@/i18n/server';
import { RuleSection } from '@/components/rules/RuleSection';
import { RuleHero } from '@/components/rules/RuleHero';
import { RuleIndex } from '@/components/rules/RuleIndex';
import { ReadingRail } from '@/components/rules/ReadingRail';

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
  const titleKeys = SECTIONS.map((s) => s.titleKey);
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <RuleHero
        icon={<Hand aria-hidden className="h-7 w-7" />}
        eyebrowKey="rules.eyebrow"
        titleKey="rules.structure.title"
        leadKey="rules.structure.lead"
      />

      {/* Mobile section index (desktop uses the sticky reading-rail instead). */}
      <div className="mt-6 lg:hidden">
        <RuleIndex titleKeys={titleKeys} />
      </div>

      <div className="mt-8 grid gap-x-10 lg:mt-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <ReadingRail titleKeys={titleKeys} />
        <div data-rules-content className="min-w-0 space-y-16 sm:space-y-20">
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
      </div>
    </main>
  );
}
