import type { Metadata } from 'next';
import { Scale } from 'lucide-react';
import { getServerT } from '@/i18n/server';
import { RuleSection } from '@/components/rules/RuleSection';
import { RuleHero } from '@/components/rules/RuleHero';
import { RuleIndex } from '@/components/rules/RuleIndex';
import { ReadingRail } from '@/components/rules/ReadingRail';

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
  const titleKeys = SECTIONS.map((s) => s.titleKey);
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <RuleHero
        icon={<Scale aria-hidden className="h-7 w-7" />}
        eyebrowKey="rules.eyebrow"
        titleKey="rules.standard.title"
        leadKey="rules.standard.lead"
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
              // TODO: бодит тайлбар бичлэг нэмэх. Standard ≠ structure-1.mp4 (placeholder).
              videoSrc={null}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
