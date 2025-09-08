import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const protectedRoutes = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const betterAuthSession = request.cookies.get('better-auth.session_token'); // Better-auth session cookie
  const isProtectedRoute = pathname.startsWith(protectedRoutes);

  // Handle OAuth callback redirects
  if (pathname.startsWith('/api/auth/callback/') && request.method === 'GET') {
    const callbackURL = request.nextUrl.searchParams.get('callbackURL');
    if (callbackURL) {
      // Let the auth handler process first, then we'll redirect
      const response = NextResponse.next();
      response.headers.set('x-callback-url', callbackURL);
      return response;
    }
  }

  // Check if user is authenticated with better-auth
  const isAuthenticated = betterAuthSession;

  // If authenticated, check if user is deleted
  if (isAuthenticated) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (session?.user?.id) {
        // Import database utilities here to avoid circular imports
        const { db } = await import('@/lib/db/drizzle');
        const { user } = await import('@/lib/db/schema');
        const { eq } = await import('drizzle-orm');

        const userResult = await db
          .select({ deletedAt: user.deletedAt })
          .from(user)
          .where(eq(user.id, session.user.id))
          .limit(1);

        if (userResult[0]?.deletedAt) {
          // User is deleted, clear session and redirect to sign-in
          const response = NextResponse.redirect(new URL('/sign-in?error=account-deactivated', request.url));
          response.cookies.delete('better-auth.session_token');
          return response;
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      // Continue normally if there's an error
    }
  }

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
