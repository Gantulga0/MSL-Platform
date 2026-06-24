import type { Metadata } from 'next';
import { Speech } from 'lucide-react';
import { getServerT } from '@/i18n/server';
import { RuleSection } from '@/components/rules/RuleSection';
import { RuleHero } from '@/components/rules/RuleHero';
import { RuleIndex } from '@/components/rules/RuleIndex';
import { ReadingRail } from '@/components/rules/ReadingRail';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('rules.mouthing.title') };
}

const SECTIONS = [
  {
    eyebrowKey: 'rules.mouthing.s1.eyebrow',
    titleKey: 'rules.mouthing.s1.title',
    paragraphKeys: ['rules.mouthing.s1.p1', 'rules.mouthing.s1.p2'],
  },
  {
    eyebrowKey: 'rules.mouthing.s2.eyebrow',
    titleKey: 'rules.mouthing.s2.title',
    paragraphKeys: [
      'rules.mouthing.s2.p1',
      'rules.mouthing.s2.p2',
      'rules.mouthing.s2.p3',
      'rules.mouthing.s2.p4',
      'rules.mouthing.s2.p5',
    ],
  },
  {
    eyebrowKey: 'rules.mouthing.s3.eyebrow',
    titleKey: 'rules.mouthing.s3.title',
    paragraphKeys: ['rules.mouthing.s3.p1', 'rules.mouthing.s3.p2'],
  },
] as const;

export default async function RulesMouthingPage(): Promise<React.ReactElement> {
  const titleKeys = SECTIONS.map((s) => s.titleKey);
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <RuleHero
        icon={<Speech aria-hidden className="h-7 w-7" />}
        eyebrowKey="rules.eyebrow"
        titleKey="rules.mouthing.title"
        leadKey="rules.mouthing.lead"
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
              // TODO: бодит тайлбар бичлэг нэмэх (placeholder харагдана).
              videoSrc={null}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
