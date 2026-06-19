'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface FormAlertProps {
  tone: 'error' | 'success';
  children: React.ReactNode;
}

/**
 * Inline auth feedback. Pairs an icon with text (never color-only, NFR-01) and
 * uses role="alert" so screen readers announce it. Errors are assertive.
 */
export function FormAlert({ tone, children }: FormAlertProps): React.ReactElement {
  const isError = tone === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-md border p-3 text-sm font-medium ${
        isError
          ? 'border-danger bg-danger-subtle text-danger'
          : 'border-success bg-success-subtle text-success'
      }`}
    >
      <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
