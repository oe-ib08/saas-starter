"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, Unlink, CheckCircle, AlertCircle } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

interface LinkedAccount {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: string;
}

interface SocialProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
}

export function SocialAccountLinking() {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const socialProviders: SocialProvider[] = [
    {
      id: 'google',
      name: 'Google',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
          />
        </svg>
      ),
      enabled: true,
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
          />
        </svg>
      ),
      enabled: true,
    }
  ];

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const fetchLinkedAccounts = async () => {
    try {
      const response = await fetch('/api/auth/linked-accounts');
      if (response.ok) {
        const data = await response.json();
        setLinkedAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to fetch linked accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const linkAccount = async (providerId: string) => {
    setLinking(providerId);
    setMessage(null);
    
    try {
      // Use better-auth's account linking functionality
      await authClient.linkSocial({
        provider: providerId as any,
        callbackURL: `${window.location.origin}/profile?linked=${providerId}`,
      });
    } catch (error) {
      console.error('Failed to link account:', error);
      setMessage({ type: 'error', text: `Failed to link ${providerId} account` });
    } finally {
      setLinking(null);
    }
  };

  const unlinkAccount = async (accountId: string, providerId: string) => {
    setUnlinking(accountId);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/auth/linked-accounts/${accountId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setLinkedAccounts(prev => prev.filter(acc => acc.id !== accountId));
        setMessage({ type: 'success', text: `${providerId} account unlinked successfully` });
      } else {
        throw new Error('Failed to unlink account');
      }
    } catch (error) {
      console.error('Failed to unlink account:', error);
      setMessage({ type: 'error', text: `Failed to unlink ${providerId} account` });
    } finally {
      setUnlinking(null);
    }
  };

  const isAccountLinked = (providerId: string) => {
    return linkedAccounts.some(acc => acc.providerId === providerId);
  };

  const getLinkedAccount = (providerId: string) => {
    return linkedAccounts.find(acc => acc.providerId === providerId);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>Link or unlink your social media accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Connected Accounts
        </CardTitle>
        <CardDescription>
          Link or unlink your social media accounts for easy sign-in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div className={`p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          {socialProviders.map((provider) => {
            const linked = isAccountLinked(provider.id);
            const account = getLinkedAccount(provider.id);
            const isLinking = linking === provider.id;
            const isUnlinking = unlinking === account?.id;

            return (
              <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {provider.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{provider.name}</span>
                      {linked && (
                        <Badge variant="secondary" className="text-xs">
                          Connected
                        </Badge>
                      )}
                    </div>
                    {linked && account && (
                      <div className="text-sm text-muted-foreground">
                        Connected on {new Date(account.createdAt).toLocaleDateString()}
                      </div>
                    )}
                    {!linked && (
                      <div className="text-sm text-muted-foreground">
                        Not connected
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {linked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unlinkAccount(account!.id, provider.name)}
                      disabled={isUnlinking}
                      className="text-destructive hover:text-destructive"
                    >
                      {isUnlinking ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2" />
                      ) : (
                        <Unlink className="h-3 w-3 mr-1" />
                      )}
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => linkAccount(provider.id)}
                      disabled={isLinking || !provider.enabled}
                    >
                      {isLinking ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2" />
                      ) : (
                        <Link className="h-3 w-3 mr-1" />
                      )}
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Linking accounts allows you to sign in using any of your connected social providers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}