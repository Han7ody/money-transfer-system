import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ==================== RBAC PLACEHOLDER ====================
  // This is a placeholder for Role-Based Access Control
  // Full RBAC implementation will be added later

  // Protected routes that require authentication
  const protectedRoutes = ['/admin', '/dashboard', '/profile', '/new-transfer', '/transactions'];

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Get token from cookie or header (placeholder - adjust based on your auth implementation)
  const token = request.cookies.get('token')?.value;

  // If accessing a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Admin routes require admin role check (placeholder)
  if (pathname.startsWith('/admin')) {
    // TODO: Add role verification here
    // For now, just check if user is authenticated
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
