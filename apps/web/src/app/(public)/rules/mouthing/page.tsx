import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { RuleArticle } from '@/components/rules/RuleArticle';

export const metadata: Metadata = { title: translate('rules.mouthing.title') };

export default function RulesMouthingPage(): React.ReactElement {
  return (
    <RuleArticle
      titleKey="rules.mouthing.title"
      leadKey="rules.mouthing.lead"
      paragraphKeys={['rules.mouthing.p1', 'rules.mouthing.p2', 'rules.mouthing.p3']}
    />
  );
}
