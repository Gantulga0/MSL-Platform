'use client';

import type { ReactNode } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Copy,
  Circle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../cn';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary';

export interface BadgeProps {
  tone?: BadgeTone;
  /** Optional leading icon. Status badges should always pair color with icon+text. */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-fg border-border',
  success: 'bg-success-subtle text-success border-success/30',
  warning: 'bg-warning-subtle text-warning border-warning/30',
  danger: 'bg-danger-subtle text-danger border-danger/30',
  info: 'bg-info-subtle text-info border-info/30',
  primary: 'bg-primary-subtle text-primary border-primary/30',
};

/**
 * Status badge. Color is NEVER the only signal — pair with an icon and text
 * (NFR-01: information not conveyed by color alone).
 */
export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
        TONES[tone],
        className,
      )}
    >
      {icon && (
        <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

/** Maps submission/word status codes to a tone + icon (single source of truth). */
const STATUS_MAP: Record<string, { tone: BadgeTone; Icon: LucideIcon }> = {
  pending: { tone: 'warning', Icon: Clock },
  approved: { tone: 'success', Icon: CheckCircle2 },
  rejected: { tone: 'danger', Icon: XCircle },
  needs_clarification: { tone: 'info', Icon: HelpCircle },
  duplicate: { tone: 'neutral', Icon: Copy },
  draft: { tone: 'neutral', Icon: Circle },
  archived: { tone: 'neutral', Icon: Circle },
};

/** Convenience status badge that picks tone + icon from a status code. */
export function StatusBadge({ status, label }: { status: string; label: string }): React.ReactElement {
  const cfg = STATUS_MAP[status] ?? { tone: 'neutral' as BadgeTone, Icon: Circle };
  const { tone, Icon } = cfg;
  return (
    <Badge tone={tone} icon={<Icon className="h-4 w-4" />}>
      {label}
    </Badge>
  );
}
