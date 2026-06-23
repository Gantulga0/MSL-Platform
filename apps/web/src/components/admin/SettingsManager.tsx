'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, EmptyState, Field, Input } from '@msl/ui';
import { useT } from '@/i18n/client';
import { FormAlert } from '@/components/auth/FormAlert';
import { updateSettingAction } from '@/lib/admin/user-actions';

export interface SettingRow {
  key: string;
  value: unknown;
}

function SettingForm({ row }: { row: SettingRow }): React.ReactElement {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await updateSettingAction(fd);
          if (res.error) setError(res.error);
          else router.refresh();
        });
      }}
    >
      <input type="hidden" name="key" value={row.key} />
      <div className="flex-1">
        <Field label={row.key}>
          <Input name="value" defaultValue={JSON.stringify(row.value)} />
        </Field>
      </div>
      <Button type="submit" size="sm" loading={pending}>
        {t('admin.settings.save')}
      </Button>
      {error && (
        <div className="w-full">
          <FormAlert tone="error">{error}</FormAlert>
        </div>
      )}
    </form>
  );
}

export function SettingsManager({ settings }: { settings: SettingRow[] }): React.ReactElement {
  const t = useT();
  if (settings.length === 0) return <EmptyState title={t('admin.settings.empty')} />;
  return (
    <Card>
      <CardBody className="space-y-4">
        {settings.map((s) => (
          <SettingForm key={s.key} row={s} />
        ))}
      </CardBody>
    </Card>
  );
}
