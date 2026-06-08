import { translate } from '@/i18n';

/** Teacher area placeholder (S-20). Filled in Phase C — exists so the teacher
 * shell + RBAC guard are reviewable. */
export default function ReviewQueuePage(): React.ReactElement {
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-fg">{translate('nav.review')}</h1>
      <p className="mt-2 text-fg-muted">{translate('shell.teacher')}</p>
    </main>
  );
}
