import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@msl/ui';
import { DEFAULT_LOCALE, translate } from '@/i18n';
import { AuthModalProvider } from '@/components/auth/AuthModalProvider';
import { cn } from "@/lib/utils";

/**
 * Inter — geometric-humanist sans with verified full Mongolian Cyrillic coverage:
 * the `cyrillic-ext` subset carries Өө (U+04E8/9) and Үү (U+04AE/AF), so every
 * Mongolian glyph renders from one self-hosted family (no FOUT, no CDN at runtime).
 */
const inter = Inter({subsets:['latin'],variable:'--font-sans'});

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
    <html lang={DEFAULT_LOCALE} className={cn("font-sans", inter.variable)}>
      <body className="min-h-screen font-sans antialiased">
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
