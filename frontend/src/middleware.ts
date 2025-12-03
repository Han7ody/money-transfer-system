import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// The secret key is used to verify the JWT signature.
const JWT_SECRET = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET || 'your-super-secret-key-change-in-production');
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Verifies a JWT token and returns its payload.
 * @param token The JWT string.
 * @param secret The secret key.
 * @returns The payload if verification is successful, otherwise null.
 */
async function verify(token: string, secret: Uint8Array): Promise<Record<string, unknown> | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as Record<string, unknown>;
    } catch (err) {
        console.error('JWT verification failed:', err);
        return null;
    }
}

/**
 * Check maintenance status from backend
 */
async function checkMaintenanceStatus(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/system/settings/maintenance`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.data?.maintenance ?? false;
        }
        return false;
    } catch (error) {
        console.error('Failed to check maintenance status:', error);
        return false;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('token')?.value;

    // Define protected route prefixes
    const adminPrefix = '/admin';
    const superAdminSystemPrefix = '/admin/system'; // System-level routes (audit logs, etc.)
    const superAdminSecurityPrefix = '/admin/security'; // Security settings - SUPER_ADMIN only
    const superAdminSettingsRoutes = ['/admin/settings/logs', '/admin/settings/smtp']; // Specific settings for SUPER_ADMIN
    const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/unauthorized', '/maintenance', '/'];

    // Allow access to public routes without checking maintenance
    if (publicRoutes.includes(pathname) || pathname.startsWith('/verify-email')) {
        return NextResponse.next();
    }
    
    // Check maintenance status for non-public routes
    const isMaintenanceMode = await checkMaintenanceStatus();
    
    // If no token, redirect to login for any protected route
    if (!token) {
        // If maintenance mode is on and route is not admin, redirect to maintenance
        if (isMaintenanceMode && !pathname.startsWith(adminPrefix)) {
            const url = request.nextUrl.clone();
            url.pathname = '/maintenance';
            return NextResponse.redirect(url);
        }

        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    const payload = await verify(token, JWT_SECRET);

    // If token is invalid, delete cookie and redirect to login
    if (!payload) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        const res = NextResponse.redirect(url);
        res.cookies.delete('token');
        return res;
    }

    const userRole = payload.role as string;
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const isAdmin = userRole === 'ADMIN' || isSuperAdmin;

    // If maintenance mode is on and user is not admin, redirect to maintenance page
    if (isMaintenanceMode && !isAdmin && !pathname.startsWith(adminPrefix)) {
        const url = request.nextUrl.clone();
        url.pathname = '/maintenance';
        return NextResponse.redirect(url);
    }

    // Rule 1: /admin/system/** -> ONLY super_admin (audit logs, system settings)
    if (pathname.startsWith(superAdminSystemPrefix)) {
        if (!isSuperAdmin) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    // Rule 2: /admin/security/** -> ONLY super_admin (security settings)
    if (pathname.startsWith(superAdminSecurityPrefix)) {
        if (!isSuperAdmin) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    // Rule 3: Specific settings routes -> ONLY super_admin
    if (superAdminSettingsRoutes.some(route => pathname.startsWith(route))) {
        if (!isSuperAdmin) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }

    // Rule 4: /admin/** -> admin OR super_admin (general admin access)
    if (pathname.startsWith(adminPrefix)) {
        if (!isAdmin) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
    }
    
    // Rule: /dashboard, /profile, etc. -> Any authenticated user
    // The initial check for a valid token already handles this. If a user who is not an admin
    // tries to access /admin, they are redirected. Otherwise, they can access their own pages.

    return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for API routes, Next.js static files, and image assets
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
