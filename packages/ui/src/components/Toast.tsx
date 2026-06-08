'use client';

import * as RToast from '@radix-ui/react-toast';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '../cn';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (t: { title: string; description?: string; tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Trigger toasts from anywhere under <ToastProvider>. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const TONE_CFG: Record<ToastTone, { Icon: typeof Info; cls: string }> = {
  info: { Icon: Info, cls: 'border-info/40' },
  success: { Icon: CheckCircle2, cls: 'border-success/40' },
  warning: { Icon: AlertTriangle, cls: 'border-warning/40' },
  danger: { Icon: XCircle, cls: 'border-danger/40' },
};

export interface ToastProviderProps {
  children: ReactNode;
  closeLabel: string;
}

/**
 * Toast provider (Radix). Polite live region for info/success, assertive for
 * warning/danger; visible icon + text so notice is never color-only (NFR-01).
 */
export function ToastProvider({ children, closeLabel }: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const toast = useCallback<ToastContextValue['toast']>(({ title, description, tone = 'info' }) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((prev) => [...prev, { id, title, description, tone }]);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  const dismiss = (id: number): void => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={value}>
      <RToast.Provider swipeDirection="right">
        {children}
        {toasts.map(({ id, title, description, tone }) => {
          const { Icon, cls } = TONE_CFG[tone];
          const assertive = tone === 'warning' || tone === 'danger';
          return (
            <RToast.Root
              key={id}
              type={assertive ? 'foreground' : 'background'}
              onOpenChange={(open) => !open && dismiss(id)}
              className={cn(
                'flex items-start gap-3 rounded-md border-l-4 border border-border bg-bg p-4 shadow-lg',
                cls,
              )}
            >
              <span aria-hidden className="mt-0.5 text-fg">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <RToast.Title className="text-base font-semibold text-fg">{title}</RToast.Title>
                {description && (
                  <RToast.Description className="text-sm text-fg-muted">{description}</RToast.Description>
                )}
              </div>
              <RToast.Close aria-label={closeLabel} className="min-h-touch min-w-touch text-fg-muted hover:text-fg">
                <X className="h-5 w-5" aria-hidden />
              </RToast.Close>
            </RToast.Root>
          );
        })}
        <RToast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 outline-none" />
      </RToast.Provider>
    </ToastContext.Provider>
  );
}
