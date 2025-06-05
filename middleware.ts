import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const config = {
  matcher: '/dashboard/:path*',
};

// Define role-based path permissions
const rolePathPermissions: Record<string, string[]> = {
  admin: ['/dashboard/admin', '/dashboard/profile'],
  patient: ['/dashboard/patient', '/dashboard/profile'],
  doctor: ['/dashboard/doctor', '/dashboard/profile'],
};

// Helper function to check if a user has permission to access a path
function hasPathPermission(userRole: string, path: string): boolean {
  const allowedPaths = rolePathPermissions[userRole] || [];
  return allowedPaths.some(allowedPath => path.startsWith(allowedPath));
}

export async function middleware(req: NextRequest) {
  console.log('<<<<< MIDDLEWARE STARTING >>>>>');
  console.log('NEXTAUTH_SECRET_STATUS:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');
  console.log('<<<<< MIDDLEWARE IS RUNNING FOR:', req.nextUrl.pathname, '>>>>>');

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  console.log('Middleware triggered for:', pathname);
  console.log('Token:', token);

  // Redirect unauthenticated users to login
  if (!token && pathname.startsWith('/dashboard')) {
    console.log('No token found. Redirecting to /login.');
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (token) {
    const userRole = token.role as string;
    console.log('Authenticated user role:', userRole);

    const rolePaths: Record<string, string> = {
      admin: '/dashboard/admin',
      patient: '/dashboard/patient',
      doctor: '/dashboard/doctor',
    };

    const userSpecificDashboard = rolePaths[userRole];

    // Redirect users accessing the base /dashboard path to their specific dashboard
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      if (userSpecificDashboard) {
        console.log(`Redirecting to role-specific dashboard: ${userSpecificDashboard}`);
        return NextResponse.redirect(new URL(userSpecificDashboard, req.url));
      }
    }

    // Check if the user has permission to access the requested path
    if (!hasPathPermission(userRole, pathname)) {
      console.log(`User with role ${userRole} does not have permission to access ${pathname}`);

      // Redirect to their role-specific dashboard if they're trying to access an unauthorized path
      if (userSpecificDashboard) {
        console.log(`Redirecting to role-specific dashboard: ${userSpecificDashboard}`);
        return NextResponse.redirect(new URL(userSpecificDashboard, req.url));
      } else {
        // Fallback for users with unknown roles
        console.log('Unknown user role. Redirecting to /login.');
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }
  }

  return NextResponse.next();
}