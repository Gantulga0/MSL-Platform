import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { AuthCard } from '@/components/auth/AuthCard';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';

export const metadata: Metadata = { title: 'Имэйл баталгаажуулах' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<React.ReactElement> {
  const { token } = await searchParams;
  return (
    <AuthCard title={translate('auth.verifyTitle')}>
      <VerifyEmailForm token={token ?? ''} />
    </AuthCard>
  );
}
