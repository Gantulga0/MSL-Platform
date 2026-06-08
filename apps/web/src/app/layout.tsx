import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@msl/ui';
import { DEFAULT_LOCALE, translate } from '@/i18n';

export const metadata: Metadata = {
  title: translate('app.title'),
  description: translate('app.tagline'),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body className="min-h-screen antialiased">
        <a href="#main" className="skip-link">
          {translate('common.skipToContent')}
        </a>
        <ToastProvider closeLabel={translate('common.close')}>{children}</ToastProvider>
      </body>
    </html>
  );
}
