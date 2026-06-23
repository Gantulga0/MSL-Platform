'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Search } from 'lucide-react';
import { translate as t } from '@/i18n';
import { GestureScene } from '@/components/signs/GestureScene';

export interface PreviewWord {
  id: string;
  lemma: string;
  topic: string;
}

/** A few decorative gesture paths (320×400 space) so cards don't all look alike. */
const PATHS = [
  'M120 250 C 150 150, 210 150, 220 235 S 150 320, 200 300',
  'M90 180 C 160 90, 200 240, 250 150',
  'M100 280 C 150 150, 230 170, 240 260 S 140 320, 230 290',
  'M90 130 C 170 120, 180 280, 250 260',
];

/**
 * Landing dictionary preview: a small, real set of words from the `/words` API
 * with client-side topic-chip + text filtering. Each card links to the real
 * sign detail page. Per the agreed card design it shows the title only — no tag
 * chips, no hand chip. Keyboard-operable; the gesture visual is decorative.
 */
export function DictionaryPreview({
  words,
  allWordsHref = '/dictionary',
}: {
  words: PreviewWord[];
  allWordsHref?: string;
}): React.ReactElement {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState(t('landing.dict.allTopics'));

  const topics = useMemo(() => {
    const all = t('landing.dict.allTopics');
    const uniq = Array.from(new Set(words.map((w) => w.topic).filter(Boolean)));
    return [all, ...uniq];
  }, [words]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = t('landing.dict.allTopics');
    return words.filter(
      (w) => (topic === all || w.topic === topic) && (!q || w.lemma.toLowerCase().includes(q)),
    );
  }, [words, topic, query]);

  if (words.length === 0) {
    return <p className="noresult">{t('landing.dict.empty')}</p>;
  }

  return (
    <>
      <div className="dtools">
        <div className="dsearch glass" role="search">
          <Search aria-hidden width={20} height={20} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('landing.dict.searchPlaceholder')}
            aria-label={t('landing.dict.searchPlaceholder')}
          />
        </div>
        <div className="filters" role="group" aria-label={t('landing.dict.eyebrow')}>
          {topics.map((tp) => (
            <button
              key={tp}
              type="button"
              className="chip"
              aria-pressed={tp === topic}
              onClick={() => setTopic(tp)}
            >
              {tp}
            </button>
          ))}
        </div>
      </div>

      <div className="cards">
        {list.length === 0 ? (
          <div className="noresult">
            «{query}» — {t('landing.dict.noResult')}
          </div>
        ) : (
          list.map((w, i) => (
            <Link
              key={w.id}
              href={`/dictionary/${w.id}` as Route}
              className="glass card group"
              aria-label={w.lemma}
            >
              <div className="frame sign-stage is-anim">
                <GestureScene path={PATHS[i % PATHS.length]} />
                <span className="play" aria-hidden>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </div>
              <div className="cbody">
                <div className="mn">{w.lemma}</div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div style={{ marginTop: 28 }}>
        <Link className="btn btn-glass" href={allWordsHref as Route}>
          {t('landing.dict.viewAll')} →
        </Link>
      </div>
    </>
  );
}
