'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { Check, Eye, EyeOff, ShieldCheck, Sparkles, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button, Field, Input } from '@msl/ui';
import { useT } from '@/i18n/client';
import { registerAction } from '@/lib/auth/actions';
import { localizeAuthError } from '@/lib/auth/errors';
import { FormAlert } from '../FormAlert';
import { registerSchema, fieldErrors } from '@/lib/auth/schemas';
import type { AuthViewProps } from '../authModalTypes';

/** Live password requirement checks — mirror the registerSchema rules exactly. */
function pwChecks(pw: string): { key: string; labelKey: string; ok: boolean }[] {
  return [
    { key: 'len', labelKey: 'auth.pwLen', ok: pw.length >= 8 },
    { key: 'letter', labelKey: 'auth.pwLetter', ok: /[A-Za-z]/.test(pw) },
    { key: 'num', labelKey: 'auth.pwNumber', ok: /\d/.test(pw) },
  ];
}

/**
 * Register view (email account, S-03). Rebuilt on the shared Tailwind tokens +
 * primitives (Field/Input/Button) so it matches the rest of the app (no more
 * styled-components / Liquid Glass island). Adds persistent labels, a password
 * show/hide toggle, a live requirement checklist, a prominent consent card
 * (AUTH-02) and a desktop value panel. Submit stays wired to `registerAction`;
 * errors are text + icon, never colour alone (NFR-01). Honours reduced-motion.
 */
export function RegisterView({ onSwitch, onClose }: AuthViewProps): React.ReactElement {
  const t = useT();
  const reduce = useReducedMotion();
  const [error, setError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string>();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pending, start] = useTransition();

  const checks = useMemo(() => pwChecks(password), [password]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(undefined);
    setSuccess(undefined);
    const data = new FormData(e.currentTarget);
    const parsed = registerSchema.safeParse({
      displayName: String(data.get('displayName') ?? ''),
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
      consent: data.get('consent') === 'on',
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    start(async () => {
      const res = await registerAction(data);
      if (res?.error) setError(localizeAuthError(res.error, t));
      else if (res?.message) setSuccess(res.message);
    });
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="glass glass-strong relative grid max-h-[90vh] w-[min(56rem,92vw)] grid-cols-1 overflow-y-auto rounded-2xl md:grid-cols-[1.1fr_1fr]"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('common.close')}
        className="absolute right-3 top-3 z-20 grid h-11 w-11 place-content-center rounded-full text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <X aria-hidden className="h-5 w-5" />
      </button>

      {/* Value panel — why register (desktop only). */}
      <aside className="hidden flex-col justify-center gap-5 bg-primary p-8 text-fg-on-primary md:flex">
        <Sparkles aria-hidden className="h-8 w-8 opacity-90" />
        <h2 className="text-2xl font-bold leading-tight">{t('auth.registerValueTitle')}</h2>
        <ul className="space-y-3 text-sm">
          {['auth.registerValue1', 'auth.registerValue2', 'auth.registerValue3'].map((k) => (
            <li key={k} className="flex items-start gap-2.5">
              <Check aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <span className="opacity-90">{t(k)}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* Form panel. */}
      <div className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-fg">{t('auth.registerTitle')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('auth.registerSubtitle')}</p>

        {success ? (
          <div className="mt-6 space-y-4">
            <FormAlert tone="success">{success}</FormAlert>
            <Button variant="secondary" block onClick={() => onSwitch('login')}>
              {t('auth.backToLogin')}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            {error && <FormAlert tone="error">{error}</FormAlert>}

            <Field label={t('auth.displayName')} required error={errors.displayName}>
              <Input name="displayName" autoComplete="name" maxLength={120} />
            </Field>

            <Field label={t('auth.email')} required error={errors.email}>
              <Input name="email" type="email" autoComplete="email" inputMode="email" />
            </Field>

            <Field label={t('auth.password')} required description={t('auth.passwordHint')} error={errors.password}>
              <div className="relative">
                <Input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showPw}
                  className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-content-center rounded-lg text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {showPw ? <EyeOff aria-hidden className="h-5 w-5" /> : <Eye aria-hidden className="h-5 w-5" />}
                </button>
              </div>
            </Field>

            {/* Live requirement checklist (icon + text, never colour alone). */}
            {password.length > 0 && (
              <ul className="grid gap-1.5 sm:grid-cols-3">
                {checks.map((c) => (
                  <li key={c.key} className="flex items-center gap-1.5 text-xs">
                    <motion.span
                      initial={false}
                      animate={{ scale: c.ok && !reduce ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 0.25 }}
                      className={c.ok ? 'text-success' : 'text-fg-subtle'}
                    >
                      {c.ok ? (
                        <Check aria-hidden className="h-4 w-4" />
                      ) : (
                        <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </motion.span>
                    <span className={c.ok ? 'font-medium text-fg' : 'text-fg-muted'}>{t(c.labelKey)}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Consent — prominent, legally important (AUTH-02). */}
            <label className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-3.5 text-sm text-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
              <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-accent-ink" />
              <input name="consent" type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
              <span>{t('auth.consentLabel')}</span>
            </label>
            {errors.consent && (
              <p role="alert" className="text-sm font-medium text-danger">
                {errors.consent}
              </p>
            )}

            <Button type="submit" block size="lg" loading={pending}>
              {t('auth.registerButton')}
            </Button>

            <p className="text-center text-sm text-fg-muted">
              {t('auth.haveAccount')}{' '}
              <button
                type="button"
                onClick={() => onSwitch('login')}
                className="font-semibold text-primary underline underline-offset-2"
              >
                {t('auth.loginLink')}
              </button>
            </p>
          </form>
        )}
      </div>
    </motion.div>
  );
}
