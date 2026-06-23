import type { Metadata } from 'next';
import { NotFoundScreen } from '@/components/system/NotFoundScreen';

export const metadata: Metadata = { title: '404' };

/** Public-area 404 — rendered within the AppShell so the navbar stays. */
export default function NotFound(): React.ReactElement {
  return <NotFoundScreen />;
}
