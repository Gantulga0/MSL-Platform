import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Нэвтрэх' };

export default function LoginPage(): React.ReactElement {
  return (
    <AuthCard title={translate('auth.loginTitle')} subtitle={translate('auth.loginSubtitle')}>
      <LoginForm />
    </AuthCard>
  );
}
