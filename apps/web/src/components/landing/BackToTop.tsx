'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { translate as t } from '@/i18n';

/**
 * Back-to-top button (landing chrome). Appears after scrolling past ~600px and
 * smooth-scrolls to the top. A real <button> with an i18n label; the icon is
 * decorative. Smooth scroll respects the OS reduced-motion setting via CSS.
 */
export function BackToTop(): React.ReactElement {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll(): void {
      setShow(document.documentElement.scrollTop > 600);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function toTop(): void {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={t('landing.backToTop')}
      className={`l-totop${show ? ' show' : ''}`}
    >
      <ArrowUp aria-hidden className="h-5 w-5" />
    </button>
  );
}
