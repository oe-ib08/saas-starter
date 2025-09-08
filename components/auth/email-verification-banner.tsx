"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Mail, X } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface EmailVerificationBannerProps {
  user: {
    email: string;
    emailVerified: boolean;
  };
  onDismiss?: () => void;
}

export function EmailVerificationBanner({ user, onDismiss }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (user.emailVerified || dismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsResending(true);
    setMessage(null);
    
    try {
      // Use better-auth's resend verification method
      const result = await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: `${window.location.origin}/verify-email`,
      });

      if (result.error) {
        setMessage(result.error.message || 'Failed to send verification email');
      } else {
        setMessage('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setMessage('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardContent className="flex items-start gap-3 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200">
                Email verification required
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Please verify your email address ({user.email}) to secure your account and enable all features.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isResending ? 'Sending...' : 'Resend verification email'}
            </Button>
          </div>
          
          {message && (
            <p className={cn(
              "text-sm",
              message.includes('sent') || message.includes('check') 
                ? "text-green-700 dark:text-green-300" 
                : "text-red-700 dark:text-red-300"
            )}>
              {message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}