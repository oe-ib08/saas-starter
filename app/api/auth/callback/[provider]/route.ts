import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const provider = url.pathname.split('/').pop(); // Extract provider from URL
  
  // First, let better-auth handle the OAuth callback
  const response = await auth.handler(request);
  
  // If it's a successful callback (302 redirect), intercept and redirect to dashboard
  if (response.status === 302) {
    // Check if the user is now authenticated
    const location = response.headers.get('location');
    if (location) {
      // If redirecting back to sign-in, redirect to dashboard instead
      if (location.includes('/sign-in') || location === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }
  
  return response;
}
