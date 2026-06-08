import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '@msl/ui';
import { translate } from '@/i18n';

/** Full-area 403 state shown by route-group guards (RBAC, server-side). */
export function Forbidden(): React.ReactElement {
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-16">
      <EmptyState
        icon={<ShieldAlert className="h-12 w-12" />}
        title={translate('shell.forbiddenTitle')}
        description={translate('shell.forbiddenBody')}
      />
    </main>
  );
}
