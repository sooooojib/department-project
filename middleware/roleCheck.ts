import { SessionPayload } from '@/lib/auth';

export const roleRoutes = {
    STUDENT: '/dashboard/student',
    TEACHER: '/dashboard/teacher',
    CR: '/dashboard/cr',
    ADMIN: '/dashboard/admin',
};

export function getDashboardRoute(role: keyof typeof roleRoutes | string): string {
    const normalizedRole = role.toUpperCase() as keyof typeof roleRoutes;
    return roleRoutes[normalizedRole] || '/dashboard';
}

export function isAuthorizedRoute(pathname: string, role: string): boolean {
    const normalizedRole = role.toUpperCase() as keyof typeof roleRoutes;
    const allowedRoute = roleRoutes[normalizedRole];

    if (!allowedRoute) return false;

    // A user is authorized if the route starts with their allowed dashboard route
    return pathname.startsWith(allowedRoute);
}
