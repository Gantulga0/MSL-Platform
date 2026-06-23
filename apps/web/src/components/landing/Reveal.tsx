'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Scroll-reveal wrapper for the landing page.
 *
 * SSR-safe by design: the server (and any no-JS client) renders a plain, fully
 * VISIBLE `<div>` — content is never hidden behind CSS or a Framer `initial`
 * state. Only AFTER mount (and only when motion is allowed) does it upgrade to a
 * `motion.div` that fades/lifts in on first view. This guarantees the content is
 * visible the instant it loads — fixing the earlier "text invisible until
 * interaction" bug — and honours reduced-motion (NFR-01).
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}): React.ReactElement {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Server render, first client render, and reduced-motion: plain visible div.
  if (!mounted || reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
