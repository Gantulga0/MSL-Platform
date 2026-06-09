'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Button, Card, CardBody, CardTitle } from '@msl/ui';

export function RoleSwitcher(): React.ReactElement {
  return (
    <Card>
      <CardBody className="space-y-4">
        <CardTitle>RBAC (нэвтрэлт)</CardTitle>
        <Link href={'/login' as Route}>
          <Button size="sm">Нэвтрэх</Button>
        </Link>
        <div className="flex flex-wrap gap-4 text-base">
          <Link className="text-primary underline" href={'/submit-word' as Route}>
            /submit-word (public form)
          </Link>
          <Link className="text-primary underline" href={'/profile' as Route}>
            /profile (signed-in)
          </Link>
          <Link className="text-primary underline" href={'/admin/submissions' as Route}>
            /admin/submissions (admin)
          </Link>
          <Link className="text-primary underline" href={'/admin/words' as Route}>
            /admin/words (admin)
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
