'use client';

import { ErrorScreen } from '@/components/system/ErrorScreen';

/** Global fallback error boundary (renders without the app shell). */
export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return <ErrorScreen {...props} />;
}
