'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Button, Card, CardBody, CardTitle } from '@msl/ui';
import { useAuthModal } from '@/components/auth/AuthModalProvider';

export function RoleSwitcher(): React.ReactElement {
  const { open } = useAuthModal();
  return (
    <Card>
      <CardBody className="space-y-4">
        <CardTitle>RBAC (нэвтрэлт)</CardTitle>
        <Button size="sm" onClick={() => open('login')}>
          Нэвтрэх
        </Button>
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
