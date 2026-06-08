'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Button, Card, CardBody, CardTitle } from '@msl/ui';

/**
 * Real auth is now wired (Phase C, Slice 1): RBAC is driven by the JWT session,
 * not a demo cookie. This panel just links to the live login + the guarded areas
 * so the route-group guards can be exercised after signing in.
 */
export function RoleSwitcher(): React.ReactElement {
  return (
    <Card>
      <CardBody className="space-y-4">
        <CardTitle>RBAC (нэвтрэлт)</CardTitle>
        <Link href={'/login' as Route}>
          <Button size="sm">Нэвтрэх</Button>
        </Link>
        <div className="flex flex-wrap gap-4 text-base">
          <Link className="text-primary underline" href={'/profile' as Route}>
            /profile (learner+)
          </Link>
          <Link className="text-primary underline" href={'/review' as Route}>
            /review (teacher+)
          </Link>
          <Link className="text-primary underline" href={'/admin' as Route}>
            /admin (admin)
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
