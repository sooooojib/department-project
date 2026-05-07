import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getDashboardRoute, isAuthorizedRoute } from '@/middleware/roleCheck';

// Define paths that don't require authentication
const publicPaths = ['/login', '/signup', '/api/auth/login', '/api/auth/signup', '/_next', '/favicon.ico'];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Allow public paths to proceed directly
    if (publicPaths.some(path => pathname.startsWith(path)) || pathname === '/') {

        // If user is trying to access /login or /signup while already logged in, redirect them
        if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
            const token = req.cookies.get('token')?.value;
            if (token) {
                const payload = await decrypt(token);
                if (payload && payload.role) {
                    return NextResponse.redirect(new URL(getDashboardRoute(payload.role), req.url));
                }
            }
        }

        return NextResponse.next();
    }

    // Determine if this is a protected route (anything under /dashboard)
    const isProtectedRoute = pathname.startsWith('/dashboard');

    if (isProtectedRoute) {
        const token = req.cookies.get('token')?.value;

        // No token, redirect to login
        if (!token) {
            return NextResponse.redirect(new URL('/login', req.url));
        }

        // Decrypt the token
        const payload = await decrypt(token);

        // Invalid token, redirect to login
        if (!payload || !payload.role) {
            const response = NextResponse.redirect(new URL('/login', req.url));
            response.cookies.delete('token');
            return response;
        }

        // Role-based authorization check
        if (!isAuthorizedRoute(pathname, payload.role)) {
            // If they try to access another role's dashboard, send them to their own
            return NextResponse.redirect(new URL(getDashboardRoute(payload.role), req.url));
        }

        // Authorized, proceed
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-user-id', payload.userId);
        requestHeaders.set('x-user-role', payload.role);

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public static files)
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
