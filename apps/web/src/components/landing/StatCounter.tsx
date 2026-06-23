'use client';

import { useEffect, useState } from 'react';

/** Format an integer with thin spaces as the thousands separator (mn). */
function fmt(n: number): string {
  return n.toLocaleString('mn-MN').replace(/[, ]/g, ' ');
}

/**
 * Animated count-up for a hero stat. Eases from 0 to `value` on mount; with
 * reduced-motion it renders the final value immediately (no animation, NFR-01).
 */
export function StatCounter({
  value,
  suffix = '',
}: {
  value: number;
  suffix?: string;
}): React.ReactElement {
  const [n, setN] = useState(value);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
    const tick = (now: number): void => {
      const p = Math.min(1, (now - start) / dur);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setN(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <b>
      {fmt(n)}
      {suffix}
    </b>
  );
}
