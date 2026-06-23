import type { Metadata } from 'next';
import { NotFoundScreen } from '@/components/system/NotFoundScreen';

export const metadata: Metadata = { title: '404' };

/** Admin-area 404 — rendered within the admin AppShell. */
export default function NotFound(): React.ReactElement {
  return <NotFoundScreen />;
}
