import type { Metadata } from 'next';
import { getServerT } from '@/i18n/server';
import { AuthCard } from '@/components/auth/AuthCard';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';

export const metadata: Metadata = { title: 'Имэйл баталгаажуулах' };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<React.ReactElement> {
  const t = await getServerT();
  const { token } = await searchParams;
  return (
    <AuthCard title={t('auth.verifyTitle')}>
      <VerifyEmailForm token={token ?? ''} />
    </AuthCard>
  );
}
