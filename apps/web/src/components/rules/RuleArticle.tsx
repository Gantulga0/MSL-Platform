import { translate } from '@/i18n';

export interface RuleArticleProps {
  /** i18n key for the page title. */
  titleKey: string;
  /** i18n key for the short lead paragraph under the title. */
  leadKey: string;
  /** i18n keys for the body paragraphs, in order. */
  paragraphKeys: string[];
}

/**
 * Shared layout for the "Дүрэм" reference pages. Follows the public page pattern
 * (centered `max-w` container, semantic landmarks, i18n-only copy). Readable
 * measure for long-form text (NFR-01, WCAG 2.2 AA).
 */
export function RuleArticle({
  titleKey,
  leadKey,
  paragraphKeys,
}: RuleArticleProps): React.ReactElement {
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <article className="space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {translate(titleKey)}
          </h1>
          <p className="text-lg text-fg-muted">{translate(leadKey)}</p>
        </header>
        <div className="space-y-4 text-base leading-relaxed text-fg">
          {paragraphKeys.map((key) => (
            <p key={key}>{translate(key)}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
