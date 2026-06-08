'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ROLES, type Role } from '@msl/types';
import { Button, Card, CardBody, CardTitle } from '@msl/ui';

/**
 * Dev-only helper to exercise the route-group RBAC guards: sets the demo role
 * cookie read by `getSession()` (Phase A stub), then links to guarded areas.
 * Removed when Phase C wires real auth.
 */
export function RoleSwitcher(): React.ReactElement {
  const setRole = (role: Role): void => {
    document.cookie = `msl_demo_role=${role}; path=/; max-age=86400`;
    window.location.reload();
  };

  return (
    <Card>
      <CardBody className="space-y-4">
        <CardTitle>RBAC демо (role switcher)</CardTitle>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <Button key={role} size="sm" variant="secondary" onClick={() => setRole(role)}>
              {role}
            </Button>
          ))}
        </div>
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
