import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { RuleArticle } from '@/components/rules/RuleArticle';

export const metadata: Metadata = { title: translate('rules.structure.title') };

export default function RulesStructurePage(): React.ReactElement {
  return (
    <RuleArticle
      titleKey="rules.structure.title"
      leadKey="rules.structure.lead"
      paragraphKeys={['rules.structure.p1', 'rules.structure.p2', 'rules.structure.p3']}
    />
  );
}
