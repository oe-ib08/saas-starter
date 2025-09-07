'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const session = await authClient.getSession();
        if (session) {
          // User is authenticated, redirect to dashboard
          const urlParams = new URLSearchParams(window.location.search);
          const redirect = urlParams.get('redirect') || '/dashboard';
          router.push(redirect);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  return null; // This component doesn't render anything
}

export default AuthRedirect;
