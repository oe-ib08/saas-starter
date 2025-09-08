"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, UserX, RotateCcw } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

interface AccountDangerZoneProps {
  userEmail: string;
}

export function AccountDangerZone({ userEmail }: AccountDangerZoneProps) {
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDeactivateAccount = async () => {
    setDeactivating(true);
    try {
      const response = await fetch('/api/user/deactivate', {
        method: 'POST',
      });

      if (response.ok) {
        await authClient.signOut();
        router.push('/account-deactivated');
      } else {
        console.error('Failed to deactivate account');
      }
    } catch (error) {
      console.error('Error deactivating account:', error);
    } finally {
      setDeactivating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmEmail !== userEmail) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
      });

      if (response.ok) {
        await authClient.signOut();
        router.push('/sign-up');
      } else {
        console.error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          These actions will affect your account access and data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Account Deactivation */}
        <div className="p-4 border border-orange-200 rounded-lg bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <div className="flex items-start gap-3">
            <UserX className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-orange-900 dark:text-orange-100">
                Deactivate Account
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                Temporarily disable your account. You can reactivate it within 30 days.
              </p>
              {!showDeactivateConfirm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeactivateConfirm(true)}
                  className="mt-3 border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Deactivate Account
                </Button>
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Are you sure? Your account will be deactivated and you'll be signed out. 
                    You can reactivate by signing in within 30 days.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleDeactivateAccount}
                      disabled={deactivating}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {deactivating ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2" />
                          Deactivating...
                        </>
                      ) : (
                        'Yes, Deactivate'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeactivateConfirm(false)}
                      disabled={deactivating}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Permanent Deletion */}
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900 dark:text-red-100">
                Delete Account Permanently
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-3"
                >
                  Delete Account
                </Button>
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    This action cannot be undone. All your data will be permanently deleted.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail" className="text-sm text-red-700 dark:text-red-300">
                      Type your email address to confirm: <strong>{userEmail}</strong>
                    </Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      className="border-red-300 focus:border-red-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={confirmEmail !== userEmail || deleting}
                    >
                      {deleting ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-2" />
                          Deleting...
                        </>
                      ) : (
                        'Yes, Delete Forever'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setConfirmEmail('');
                      }}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}