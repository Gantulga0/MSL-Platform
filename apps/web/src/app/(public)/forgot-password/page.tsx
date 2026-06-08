import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { AuthCard } from '@/components/auth/AuthCard';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Нууц үг сэргээх' };

export default function ForgotPasswordPage(): React.ReactElement {
  return (
    <AuthCard title={translate('auth.forgotTitle')} subtitle={translate('auth.forgotSubtitle')}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
