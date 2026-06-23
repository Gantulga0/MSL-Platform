import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '@msl/ui';
import { getServerT } from '@/i18n/server';

/** Full-area 403 state shown by route-group guards (RBAC, server-side). */
export async function Forbidden(): Promise<React.ReactElement> {
  const t = await getServerT();
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-16">
      <EmptyState
        icon={<ShieldAlert className="h-12 w-12" />}
        title={t('shell.forbiddenTitle')}
        description={t('shell.forbiddenBody')}
      />
    </main>
  );
}
