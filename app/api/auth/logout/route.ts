import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // Create a response that redirects back to the login page (or just returns success)
    const response = NextResponse.json(
        { message: 'Logout successful' },
        { status: 200 }
    );

    // To clear the cookie, set it with an expired maxAge
    response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });

    return response;
}
