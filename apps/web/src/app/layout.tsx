import type { Metadata } from 'next';
import { Inter, Pacifico } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@msl/ui';
import { getServerT, getLocale } from '@/i18n/server';
import { LocaleProvider } from '@/i18n/client';
import { AuthModalProvider } from '@/components/auth/AuthModalProvider';
import { CursorGradient } from '@/components/CursorGradient';
import { cn } from "@/lib/utils";

/**
 * Inter — body family. Covers Mongolian Cyrillic (incl. Өө/Үү via `cyrillic-ext`);
 * self-hosted by next/font (no runtime CDN, no FOUT). Exposed as `--font-sans` so
 * existing `font-sans` usages re-point to it with no class changes.
 */
const inter = Inter({ subsets: ['latin', 'cyrillic', 'cyrillic-ext'], variable: '--font-sans' });

/**
 * Inter (heavier weights) — display family for headings, wired to `--font-display`
 * (Tailwind `font-display`). Everything non-Pacifico now reads as Inter.
 */
const interDisplay = Inter({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  weight: ['600', '700', '800'],
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('app.title'),
    description: t('app.tagline'),
    icons: {
      icon: '/favicon.png',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): Promise<React.ReactElement> {
  const locale = await getLocale();
  const t = await getServerT();
  return (
    <html
      lang={locale}
      className={cn('font-sans', inter.variable, interDisplay.variable, pacifico.variable)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <LocaleProvider locale={locale}>
          <CursorGradient />
          <a href="#main" className="skip-link">
            {t('common.skipToContent')}
          </a>
          <ToastProvider closeLabel={t('common.close')}>
            <AuthModalProvider>{children}</AuthModalProvider>
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
