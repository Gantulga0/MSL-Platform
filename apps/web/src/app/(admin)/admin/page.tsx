import { translate } from '@/i18n';

/** Admin area placeholder (S-25). Filled in Phase C — exists so the admin shell
 * + RBAC guard are reviewable. */
export default function AdminDashboardPage(): React.ReactElement {
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-fg">{translate('nav.adminDashboard')}</h1>
      <p className="mt-2 text-fg-muted">{translate('shell.admin')}</p>
    </main>
  );
}
