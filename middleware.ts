import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
