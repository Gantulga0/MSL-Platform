'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { Pagination } from '@msl/ui';
import { translate as t } from '@/i18n';

/** URL-driven wrapper around the Pagination primitive (updates ?page=). */
export function Pager({ page, totalPages }: { page: number; totalPages: number }): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function go(next: number): void {
    const sp = new URLSearchParams(params.toString());
    sp.set('page', String(next));
    router.push(`${pathname}?${sp.toString()}` as Route);
  }

  return (
    <Pagination
      page={page}
      totalPages={totalPages}
      onPageChange={go}
      labels={{
        nav: t('pagination.nav'),
        previous: t('common.previous'),
        next: t('common.next'),
        page: (p, total) => t('pagination.page', undefined, { page: p, total }),
      }}
    />
  );
}
