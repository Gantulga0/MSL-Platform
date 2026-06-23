import type { Metadata } from 'next';
import { getServerT } from '@/i18n/server';
import { AuthCard } from '@/components/auth/AuthCard';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = { title: 'Шинэ нууц үг' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<React.ReactElement> {
  const t = await getServerT();
  const { token } = await searchParams;
  return (
    <AuthCard title={t('auth.resetTitle')}>
      <ResetPasswordForm token={token ?? ''} />
    </AuthCard>
  );
}
