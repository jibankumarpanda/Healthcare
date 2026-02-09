import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/webhooks',
  '/health',
];

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/upload',
  '/predictions',
  '/resources',
  '/profile',
  '/api/documents',
  '/api/pdf',
];

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => 
    pathname === route || (route !== '/' && pathname.startsWith(route))
  );

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => 
    pathname === route || pathname.startsWith(route)
  );

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = req.cookies.get('authToken')?.value;

  // If protected route and no token, redirect to sign-in
  if (isProtectedRoute && !token) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
