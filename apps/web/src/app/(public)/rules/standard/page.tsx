import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { RuleArticle } from '@/components/rules/RuleArticle';

export const metadata: Metadata = { title: translate('rules.standard.title') };

export default function RulesStandardPage(): React.ReactElement {
  return (
    <RuleArticle
      titleKey="rules.standard.title"
      leadKey="rules.standard.lead"
      paragraphKeys={['rules.standard.p1', 'rules.standard.p2', 'rules.standard.p3']}
    />
  );
}
