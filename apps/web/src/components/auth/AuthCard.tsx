import { Card, CardBody } from '@msl/ui';

export interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Centered, mobile-first container shared by all auth screens (S-02/03/04). */
export function AuthCard({ title, subtitle, children }: AuthCardProps): React.ReactElement {
  return (
    <main id="main" className="mx-auto w-full max-w-md px-4 py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-fg">{title}</h1>
        {subtitle && <p className="mt-1 text-fg-muted">{subtitle}</p>}
      </header>
      <Card>
        <CardBody>{children}</CardBody>
      </Card>
    </main>
  );
}
