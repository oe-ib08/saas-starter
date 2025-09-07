import { Suspense } from 'react';
import { BetterAuthLogin } from '@/components/auth/better-auth-login';

export default function LoginPage() {
  return (
    <Suspense>
      <BetterAuthLogin mode="signin" />
    </Suspense>
  );
}
