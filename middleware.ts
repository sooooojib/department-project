import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { getDashboardRoute, isAuthorizedRoute } from '@/middleware/roleCheck';

// Define paths that don't require authentication
const publicPaths = ['/login', '/signup', '/api/auth/signup', '/_next', '/favicon.ico'];

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const token = req.nextauth.token;

        // Allow public paths to proceed directly
        if (publicPaths.some(path => pathname.startsWith(path)) || pathname === '/') {
            // If user is trying to access /login or /signup while already logged in, redirect them
            if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
                if (token && token.role) {
                    return NextResponse.redirect(new URL(getDashboardRoute(token.role as string), req.url));
                }
            }
            return NextResponse.next();
        }

        // Determine if this is a protected route (anything under /dashboard)
        const isProtectedRoute = pathname.startsWith('/dashboard');

        if (isProtectedRoute) {
            // No token, redirect to login
            if (!token || !token.role) {
                return NextResponse.redirect(new URL('/login', req.url));
            }

            // Role-based authorization check
            if (!isAuthorizedRoute(pathname, token.role as string)) {
                // If they try to access another role's dashboard, send them to their own
                return NextResponse.redirect(new URL(getDashboardRoute(token.role as string), req.url));
            }
            return NextResponse.next();
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                return true; // We handle the redirect logic above
            },
        },
    }
);

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
