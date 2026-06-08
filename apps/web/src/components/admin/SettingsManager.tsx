'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Field, Input } from '@msl/ui';
import { translate as t } from '@/i18n';
import { FormAlert } from '@/components/auth/FormAlert';
import { updateSettingAction } from '@/lib/admin/user-actions';

export interface SettingRow {
  key: string;
  value: unknown;
}

function SettingForm({ row }: { row: SettingRow }): React.ReactElement {
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
