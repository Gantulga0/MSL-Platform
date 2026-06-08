'use client';

import { cn } from '../cn';

/** Loading placeholder. Marked aria-hidden; pair with an aria-live status text. */
export function Skeleton({ className }: { className?: string }): React.ReactElement {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-surface-muted', className)} />;
}
