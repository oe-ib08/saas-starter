'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session to check if authentication was successful
        const session = await authClient.getSession();
        
        if (session) {
          // Get redirect URL from search params or sessionStorage
          const redirect = searchParams.get('redirect') || 
                          (typeof window !== 'undefined' ? sessionStorage.getItem('auth_redirect') : null) ||
                          '/dashboard';
          
          // Clean up sessionStorage
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('auth_redirect');
          }
          
          // Redirect to the intended destination
          router.push(redirect);
        } else {
          // Authentication failed, redirect to sign-in
          router.push('/sign-in?error=authentication_failed');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/sign-in?error=callback_error');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
