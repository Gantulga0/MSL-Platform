import { translate } from '@/i18n';

/** Learner area placeholder (S-17). Filled in Phase C — exists so the learner
 * shell + RBAC guard are reviewable. */
export default function LearnerProfilePage(): React.ReactElement {
  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-fg">{translate('nav.profile')}</h1>
      <p className="mt-2 text-fg-muted">{translate('shell.learner')}</p>
    </main>
  );
}
