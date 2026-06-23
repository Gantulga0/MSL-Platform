'use client';

import { ErrorScreen } from '@/components/system/ErrorScreen';

/** Admin-area errors render inside the admin AppShell. */
export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return <ErrorScreen {...props} />;
}
