import type { Metadata } from 'next';
import { translate } from '@/i18n';
import { AuthCard } from '@/components/auth/AuthCard';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = { title: 'Бүртгүүлэх' };

export default function RegisterPage(): React.ReactElement {
  return (
    <AuthCard title={translate('auth.registerTitle')} subtitle={translate('auth.registerSubtitle')}>
      <RegisterForm />
    </AuthCard>
  );
}
