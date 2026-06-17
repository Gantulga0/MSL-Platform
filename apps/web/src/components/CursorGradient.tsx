'use client';

import { useEffect } from 'react';

/**
 * Ambient, cursor-tracking background wash (presentational only — no state, no
 * data). Renders a fixed `.bg-gradient` layer at `z-index:-1` (styled in
 * globals.css) and eases two CSS custom properties (`--x` / `--y`) toward the
 * pointer so the colour fields drift under the glass surfaces.
 *
 * Accessibility (NFR-01): when the user prefers reduced motion the wash is
 * pinned to centre and never animates. On coarse/hover-less pointers (touch)
 * there is no cursor to follow, so it performs a slow autonomous drift instead.
 */
export function CursorGradient(): React.ReactElement {
  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noHover = window.matchMedia('(hover: none)').matches;

    if (reduceMotion) {
      // Pin to centre — no animation at all.
      root.style.setProperty('--x', '50%');
      root.style.setProperty('--y', '35%');
      return;
    }

    let tx = window.innerWidth * 0.5;
    let ty = window.innerHeight * 0.35;
    let cx = tx;
    let cy = ty;
    let raf = 0;
    let drift = 0;

    const onMove = (e: PointerEvent): void => {
      tx = e.clientX;
      ty = e.clientY;
    };
    if (!noHover) window.addEventListener('pointermove', onMove, { passive: true });

    const loop = (): void => {
      if (noHover) {
        // Slow Lissajous-style auto-drift when there is no pointer to follow.
        drift += 0.005;
        tx = window.innerWidth * (0.5 + 0.32 * Math.sin(drift));
        ty = window.innerHeight * (0.4 + 0.26 * Math.cos(drift * 0.8));
      }
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      root.style.setProperty('--x', `${cx}px`);
      root.style.setProperty('--y', `${cy}px`);
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="bg-gradient" aria-hidden />;
}
