'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { cn } from "@/lib/utils";
import { getEnhancedErrorMessage } from "@/lib/utils/error-messages";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BetterAuthLogin({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get('redirect');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    rememberMe: false,
  });
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if user is already authenticated when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (session) {
          // User is already authenticated, redirect them
          router.push(redirect || '/dashboard');
          return;
        }
      } catch (error) {
        console.error('Session check error:', error);
        // Continue with sign-in form if session check fails
      } finally {
        setCheckingSession(false);
      }
    };

    // Add a small delay to prevent rapid calls
    const timeoutId = setTimeout(checkAuth, 100);
    return () => clearTimeout(timeoutId);
  }, [router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        const result = await authClient.signUp.email({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });

        if (result.error) {
          setError(getEnhancedErrorMessage(result.error.message || 'An error occurred during sign up'));
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        });

        if (result.error) {
          setError(getEnhancedErrorMessage(result.error.message || 'Invalid email or password'));
          return;
        }
      }

      // Redirect after successful authentication
      router.push(redirect || '/dashboard');
    } catch (error) {
      console.error('Auth error:', error);
      setError(getEnhancedErrorMessage('An unexpected error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google') => {
    try {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      
      // Use better-auth's social sign-in method
      await authClient.signIn.social({
        provider,
        callbackURL: redirectTo,
      });
    } catch (error) {
      console.error('Social auth error:', error);
      setError(getEnhancedErrorMessage('Social authentication failed'));
    }
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Link href="/" className="flex items-center gap-2 self-center font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <CircleIcon className="size-4" />
            </div>
            Optume
          </Link>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Checking authentication...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <CircleIcon className="size-4" />
          </div>
          Optume
        </Link>
        
        <div className={cn("flex flex-col gap-6")}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </CardTitle>
              <CardDescription>
                {mode === 'signin' 
                  ? 'Sign in to your account' 
                  : 'Get started with your new account'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                  <div className="flex flex-col gap-4">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleSocialSignIn('google')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2">
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
                    </Button>
                  </div>
                  <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or continue with email
                    </span>
                  </div>
                  <div className="grid gap-6">
                    {mode === 'signup' && (
                      <div className="grid gap-3">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                          maxLength={100}
                        />
                      </div>
                    )}
                    <div className="grid gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        maxLength={255}
                      />
                    </div>
                    <div className="grid gap-3">
                      <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        {mode === 'signin' && (
                          <Link
                            href="/forgot-password"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </Link>
                        )}
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        minLength={8}
                        maxLength={100}
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      />
                    </div>
                    
                    {mode === 'signin' && (
                      <div className="flex items-center space-x-2">
                        <input
                          id="rememberMe"
                          type="checkbox"
                          checked={formData.rememberMe}
                          onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="rememberMe" className="text-sm font-normal">
                          Remember me for 30 days
                        </Label>
                      </div>
                    )}
                    
                    {error && (
                      <div className="text-destructive text-sm text-center">{error}</div>
                    )}
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                        </>
                      ) : mode === 'signin' ? (
                        'Sign in'
                      ) : (
                        'Create account'
                      )}
                    </Button>
                  </div>
                  <div className="text-center text-sm">
                    {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                    <Link 
                      href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${
                        redirect ? `?redirect=${redirect}` : ''
                      }`}
                      className="underline underline-offset-4"
                    >
                      {mode === 'signin' ? 'Sign up' : 'Sign in'}
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          <div className="text-muted-foreground text-center text-xs text-balance">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
