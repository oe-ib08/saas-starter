import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserX, RotateCcw, Mail } from 'lucide-react';

export default function AccountDeactivatedPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <div className="size-4 bg-current rounded-full" />
          </div>
          Optume
        </Link>
        
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <UserX className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle>Account Deactivated</CardTitle>
            <CardDescription>
              Your account has been temporarily deactivated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="font-medium text-orange-900 mb-2">What happens now?</h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Your account is temporarily suspended</li>
                <li>• You have 30 days to reactivate your account</li>
                <li>• Your data is safely preserved during this time</li>
                <li>• After 30 days, your account will be permanently deleted</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/sign-in">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reactivate Account
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/contact">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </div>
            
            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">
                Changed your mind? You can reactivate your account anytime by signing in.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}