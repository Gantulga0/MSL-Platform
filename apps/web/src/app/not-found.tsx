import type { Metadata } from 'next';
import { NotFoundScreen } from '@/components/system/NotFoundScreen';

export const metadata: Metadata = { title: '404' };

/** Global 404 fallback (unmatched top-level routes; renders without the shell). */
export default function NotFound(): React.ReactElement {
  return <NotFoundScreen />;
}
