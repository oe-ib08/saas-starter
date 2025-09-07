import { Suspense } from 'react';
import { BetterAuthLogin } from '@/components/auth/better-auth-login';

export default function SignUpPage() {
  return (
    <Suspense>
      <BetterAuthLogin mode="signup" />
    </Suspense>
  );
}
