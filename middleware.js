import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request) {
    // Check if the request is for a protected route
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/messuopas');

    if (isProtectedRoute) {
        try {
            // Get the session cookie
            const cookieStore = await cookies();
            const sessionCookie = cookieStore.get("messuopas-session");

            // If no session cookie exists, redirect to login
            if (!sessionCookie || !sessionCookie.value) {
                console.log('No session found, redirecting to login');
                return NextResponse.redirect(new URL('/login', request.url));
            }

            // Session exists, allow the request to continue
            return NextResponse.next();

        } catch (error) {
            console.error('Middleware error:', error);
            // On any error, redirect to login for security
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // For all other routes, continue normally
    return NextResponse.next();
}

export const config = {
    // Match protected routes
    matcher: '/messuopas/:path*'
};
