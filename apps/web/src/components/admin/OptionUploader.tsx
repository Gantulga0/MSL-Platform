'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Field, Input } from '@msl/ui';
import { useT } from '@/i18n/client';
import { FormAlert } from '@/components/auth/FormAlert';
import { uploadOptionAction } from '@/lib/admin/option-actions';

const KINDS = [{ value: 'handedness', labelKey: 'dict.hands' }] as const;

const selectCls = 'h-control-sm w-full rounded-md border border-border-strong bg-bg px-3 text-base text-fg';

/** Admin form to add a new option (image + code/label) to any of the 4 kinds. */
export function OptionUploader(): React.ReactElement {
  const t = useT();
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [kind, setKind] = useState<string>('handedness');
  const [pending, start] = useTransition();
  const [formKey, setFormKey] = useState(0);

  return (
    <Card>
      <CardBody className="space-y-4">
        <h2 className="text-lg font-semibold text-fg">{t('admin.options.add')}</h2>
        <form
          key={formKey}
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError(undefined);
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await uploadOptionAction(fd);
              if (res.error) setError(res.error);
              else {
                setFormKey((k) => k + 1);
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
          <Field label={t('admin.options.kind')} required>
            <select
              name="kind"
              className={selectCls}
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {t(k.labelKey)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('admin.options.code')} required>
            <Input name="code" required maxLength={64} />
          </Field>
          <Field label={t('admin.options.label')} required>
            <Input name="label" required maxLength={120} />
          </Field>
          {kind === 'handedness' && (
            <Field label={t('admin.options.handCount')} required>
              <select name="handCount" className={selectCls} defaultValue="1">
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </Field>
          )}
          <div className="sm:col-span-2">
            <Field label={t('admin.options.image')} required>
              <input
                type="file"
                name="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                required
                className="block w-full text-sm text-fg file:mr-3 file:min-h-touch file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:font-medium file:text-fg-on-primary hover:file:bg-primary/90"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={pending}>
              {t('admin.options.upload')}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
