import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { RuleSection } from '@/components/rules/RuleSection';
import { RulesNav } from '@/components/rules/RulesNav';

export const metadata: Metadata = { title: translate('rules.standard.title') };

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

export default function RulesStandardPage(): React.ReactElement {
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <header className="mx-auto max-w-3xl space-y-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {translate('rules.standard.title')}
        </h1>
        <p className="text-lg text-fg-muted">{translate('rules.standard.lead')}</p>
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
            // TODO: бодит тайлбар бичлэг нэмэх. Standard ≠ structure-1.mp4 (placeholder).
            videoSrc={null}
          />
        ))}
      </div>
    </main>
  );
}
