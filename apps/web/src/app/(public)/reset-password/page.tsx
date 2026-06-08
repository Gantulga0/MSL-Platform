import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { AuthCard } from '@/components/auth/AuthCard';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = { title: 'Шинэ нууц үг' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<React.ReactElement> {
  const { token } = await searchParams;
  return (
    <AuthCard title={translate('auth.resetTitle')}>
      <ResetPasswordForm token={token ?? ''} />
    </AuthCard>
  );
}
