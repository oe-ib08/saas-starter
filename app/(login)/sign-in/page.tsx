import { Suspense } from 'react';
import { BetterAuthLogin } from '@/components/auth/better-auth-login';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error === 'account-deactivated' 
    ? 'Your account has been deactivated. Please contact support for assistance.'
    : undefined;

  return (
    <Suspense>
      <BetterAuthLogin mode="signin" initialError={errorMessage} />
    </Suspense>
  );
}
