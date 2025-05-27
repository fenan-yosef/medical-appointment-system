import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const config = {
  matcher: '/dashboard/:path*',
};

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // If no token and trying to access a dashboard path, redirect to login
  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token) {
    const userRole = token.role as string; // Assuming role is stored in the token

    // Define role-based path prefixes
    const rolePaths: Record<string, string> = {
      admin: '/dashboard/admin',
      patient: '/dashboard/patient',
      // Add other roles and their paths here
    };

    const userSpecificDashboard = rolePaths[userRole];

    // If user is trying to access a path not matching their role
    if (userSpecificDashboard && !pathname.startsWith(userSpecificDashboard)) {
      // Redirect to their correct dashboard page
      return NextResponse.redirect(new URL(userSpecificDashboard, req.url));
    }

    // If user is trying to access the base /dashboard path, redirect to their specific role dashboard
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
        if (userSpecificDashboard) {
            return NextResponse.redirect(new URL(userSpecificDashboard, req.url));
        }
        // If userSpecificDashboard is not defined for the role,
        // it means the role doesn't have a specific dashboard.
        // Decide how to handle this: maybe redirect to a generic dashboard or show an error.
        // For now, letting it pass, or you could redirect to a default page or error.
        // Or, if all roles MUST have a specific dashboard, this case might indicate a misconfiguration or unexpected role.
    }
  }

  return NextResponse.next();
}
