import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { RuleSection } from '@/components/rules/RuleSection';
import { RulesNav } from '@/components/rules/RulesNav';

export const metadata: Metadata = { title: translate('rules.mouthing.title') };

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

export default function RulesMouthingPage(): React.ReactElement {
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <header className="mx-auto max-w-3xl space-y-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {translate('rules.mouthing.title')}
        </h1>
        <p className="text-lg text-fg-muted">{translate('rules.mouthing.lead')}</p>
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
            // TODO: бодит тайлбар бичлэг нэмэх (placeholder харагдана).
            videoSrc={null}
          />
        ))}
      </div>
    </main>
  );
}
