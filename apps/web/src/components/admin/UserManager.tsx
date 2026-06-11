'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody, Field, Input } from '@msl/ui';
import { translate as t } from '@/i18n';
import { FormAlert } from '@/components/auth/FormAlert';
import { createUserAction } from '@/lib/admin/user-actions';

export interface UserRow {
  id: string;
  role: string;
  displayName: string;
  isMinor?: boolean;
  status: string;
}

const selectCls = 'h-control-sm w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg';

export function UserManager({ users }: { users: UserRow[] }): React.ReactElement {
  const router = useRouter();
  const [role, setRole] = useState('user');
  const [isMinor, setIsMinor] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-semibold text-fg">{t('admin.users.create')}</h2>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              setError(undefined);
              const fd = new FormData(e.currentTarget);
              const form = e.currentTarget;
              start(async () => {
                const res = await createUserAction(fd);
                if (res.error) setError(res.error);
                else {
                  form.reset();
                  setRole('user');
                  setIsMinor(false);
                  router.refresh();
                }
              });
            }}
          >
            {error && (
              <div className="sm:col-span-2">
                <FormAlert tone="error">{error}</FormAlert>
              </div>
            )}
            <Field label={t('admin.users.role')} required>
              <select name="role" className={selectCls} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </Field>
            <Field label={t('admin.users.name')} required>
              <Input name="displayName" required maxLength={120} />
            </Field>
            <Field label={t('admin.users.minorAccount')}>
              <label className="flex min-h-touch items-center gap-2 text-base">
                <input
                  type="checkbox"
                  name="isMinor"
                  checked={isMinor}
                  onChange={(e) => setIsMinor(e.target.checked)}
                />
                {t('admin.users.minorHint')}
              </label>
            </Field>
            {isMinor ? (
              <>
                <Field label={t('admin.users.username')} required>
                  <Input name="username" required />
                </Field>
                <Field label={t('admin.users.pin')}>
                  <Input name="pin" inputMode="numeric" pattern="\d{4,8}" />
                </Field>
              </>
            ) : (
              <>
                <Field label={t('admin.users.email')} required>
                  <Input name="email" type="email" required />
                </Field>
                <Field label={t('admin.users.password')} required>
                  <Input name="password" type="password" required />
                </Field>
              </>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" loading={pending}>
                {t('admin.users.create')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
            <div>
              <span className="font-medium text-fg">{u.displayName}</span>{' '}
              {u.isMinor && <span className="text-sm text-fg-subtle">{t('admin.users.minorTag')}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="neutral">{u.role}</Badge>
              <Badge tone={u.status === 'active' ? 'success' : 'warning'}>{u.status}</Badge>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
