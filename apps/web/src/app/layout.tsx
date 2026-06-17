import type { Metadata } from 'next';
import { Golos_Text, Pacifico, Unbounded } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@msl/ui';
import { DEFAULT_LOCALE, translate } from '@/i18n';
import { AuthModalProvider } from '@/components/auth/AuthModalProvider';
import { CursorGradient } from '@/components/CursorGradient';
import { cn } from "@/lib/utils";

/**
 * Golos Text — body family. Humanist sans with full Mongolian Cyrillic coverage
 * (incl. Өө/Үү via the `cyrillic` subset); self-hosted by next/font (no runtime
 * CDN, no FOUT). Exposed as `--font-sans` so existing `font-sans` usages re-point
 * to it with no class changes.
 */
const golos = Golos_Text({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });

/**
 * Unbounded — display family for headings (700/800). Also covers Cyrillic, and
 * is wired to `--font-display` (Tailwind `font-display`).
 */
const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['700', '800'],
  variable: '--font-display',
});

/**
 * Pacifico — decorative script for the hero display heading. NOTE: Pacifico ships
 * Latin only (no Cyrillic), so Mongolian glyphs gracefully fall back to the
 * display/body family; it reads as a script accent on Latin text.
 */
const pacifico = Pacifico({ subsets: ['latin'], weight: '400', variable: '--font-pacifico' });

/**
 * Pre-hydration theme resolution (no FOUC): honour a stored choice, else fall
 * back to the OS `prefers-color-scheme`. Runs before first paint so the Liquid
 * Glass palette is correct from frame one. ThemeToggle keeps it in sync after.
 */
const THEME_INIT = `(function(){try{var t=localStorage.getItem('msl-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'night':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export const metadata: Metadata = {
  title: translate('app.title'),
  description: translate('app.tagline'),
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={cn('font-sans', golos.variable, unbounded.variable, pacifico.variable)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <CursorGradient />
        <a href="#main" className="skip-link">
          {translate('common.skipToContent')}
        </a>
        <ToastProvider closeLabel={translate('common.close')}>
          <AuthModalProvider>{children}</AuthModalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
