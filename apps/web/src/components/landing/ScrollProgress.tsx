'use client';

import { useEffect, useRef } from 'react';

/**
 * Thin reading-progress bar fixed to the top of the viewport (landing chrome).
 * Presentational + aria-hidden; updates a single element's width on scroll with
 * a passive listener. No state → no re-renders.
 */
export function ScrollProgress(): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onScroll(): void {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      el!.style.width = `${max > 0 ? (h.scrollTop / max) * 100 : 0}%`;
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return <div ref={ref} className="l-progress" aria-hidden />;
}
