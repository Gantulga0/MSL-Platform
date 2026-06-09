'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';

/** Surface tone. Pastel tints + the one charcoal contrast card. */
export type CardTone = 'white' | 'sage' | 'lavender' | 'butter' | 'dark';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Render as an interactive surface (adds hover lift). */
  interactive?: boolean;
  /** Background tone. Tints always pair with dark ink; `dark` flips to white text. */
  tone?: CardTone;
}

// Tints carry no border (they read as soft fills); white keeps a hairline.
const TONES: Record<CardTone, string> = {
  white: 'bg-surface text-fg border-border',
  sage: 'bg-tint-sage text-fg border-transparent',
  lavender: 'bg-tint-lav text-fg border-transparent',
  butter: 'bg-tint-butter text-fg border-transparent',
  dark: 'bg-dark text-fg-on-primary border-transparent',
};

export function Card({
  interactive,
  tone = 'white',
  className,
  children,
  ...rest
}: CardProps): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-xl border shadow-sm',
        TONES[tone],
        interactive &&
          'transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-within:shadow-md motion-reduce:transform-none motion-reduce:transition-none',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }): React.ReactElement {
  return <div className={cn('border-b border-border px-5 py-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }): React.ReactElement {
  return <h3 className={cn('text-lg font-semibold text-fg', className)}>{children}</h3>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }): React.ReactElement {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }): React.ReactElement {
  return <div className={cn('border-t border-border px-5 py-4', className)}>{children}</div>;
}
