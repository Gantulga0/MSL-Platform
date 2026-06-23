'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useT } from '@/i18n/client';

type Theme = 'light' | 'night';

const STORAGE_KEY = 'msl-theme';

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'night' ? 'night' : 'light';
}

/**
 * Small glass theme switch in the nav. Presentational: it flips
 * `document.documentElement.dataset.theme` between `light` and `night` (every
 * colour is a themed CSS variable, so the whole palette swaps) and persists the
 * choice in localStorage. The initial value is resolved before hydration by the
 * inline script in the root layout (prefers-color-scheme + stored choice), so we
 * only read the live DOM here — no new store/provider.
 *
 * Accessible: a real <button> with a state-aware label; the icon is decorative.
 */
export function ThemeToggle(): React.ReactElement {
  const t = useT();
  const [theme, setTheme] = useState<Theme | null>(null);

  // Sync from the DOM after mount to avoid a hydration mismatch (the server has
  // no way to know the client's resolved theme).
  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  function toggle(): void {
    const next: Theme = currentTheme() === 'night' ? 'light' : 'night';
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode / storage disabled — the toggle still works for the session.
    }
    setTheme(next);
  }

  const isNight = theme === 'night';
  // Until mounted, render a stable, theme-neutral label/icon.
  const label = theme === null ? t('theme.toggle') : t(isNight ? 'theme.toLight' : 'theme.toDark');

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="glass glass-sm inline-flex min-h-touch min-w-touch items-center justify-center rounded-full px-3 text-fg transition-transform hover:-translate-y-0.5 motion-reduce:transform-none"
    >
      {isNight ? (
        <Sun aria-hidden className="h-5 w-5" />
      ) : (
        <Moon aria-hidden className="h-5 w-5" />
      )}
    </button>
  );
}
