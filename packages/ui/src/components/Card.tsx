'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Render as an interactive surface (adds hover affordance). */
  interactive?: boolean;
}

export function Card({ interactive, className, children, ...rest }: CardProps): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-bg shadow-sm',
        interactive && 'transition-shadow hover:shadow-md focus-within:shadow-md',
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
