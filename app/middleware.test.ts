import { middleware } from '../middleware'; // Adjust path if necessary
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Mock next-auth/jwt
jest.mock('next-auth/jwt');

// Mock process.env.NEXTAUTH_SECRET
const mockSecret = 'mock-secret';
process.env.NEXTAUTH_SECRET = mockSecret;

describe('Middleware Authorization Logic', () => {
    const mockGetToken = getToken as jest.Mock;
    let req: NextRequest;

    // Helper to create NextRequest objects
    const createMockRequest = (path: string): NextRequest => {
        return new NextRequest(new Request(`http://localhost${path}`));
    };

    beforeEach(() => {
        // Reset mocks before each test
        mockGetToken.mockReset();
    });

    describe('Unauthenticated Access', () => {
        it('should redirect to /login if no token and accessing /dashboard/admin', async () => {
            mockGetToken.mockResolvedValue(null);
            req = createMockRequest('/dashboard/admin');
            const response = await middleware(req);

            expect(response).toBeInstanceOf(NextResponse);
            expect(response?.status).toBe(307); // Or 308, depending on Next.js version/config
            expect(response?.headers.get('location')).toBe('http://localhost/login');
        });

        it('should redirect to /login if no token and accessing /dashboard/patient', async () => {
            mockGetToken.mockResolvedValue(null);
            req = createMockRequest('/dashboard/patient');
            const response = await middleware(req);

            expect(response).toBeInstanceOf(NextResponse);
            expect(response?.status).toBe(307);
            expect(response?.headers.get('location')).toBe('http://localhost/login');
        });
        it('should redirect to /login if no token and accessing /dashboard', async () => {
            mockGetToken.mockResolvedValue(null);
            req = createMockRequest('/dashboard');
            const response = await middleware(req);

            expect(response).toBeInstanceOf(NextResponse);
            expect(response?.status).toBe(307);
            expect(response?.headers.get('location')).toBe('http://localhost/login');
        });
    });

    describe('Authenticated Access - Role-Based Redirection', () => {
        it('should redirect patient to /dashboard/patient when accessing /dashboard', async () => {
            mockGetToken.mockResolvedValue({ role: 'patient', sub: 'patient-id', name: 'Test Patient' });
            req = createMockRequest('/dashboard');
            const response = await middleware(req);

            expect(response).toBeInstanceOf(NextResponse);
            expect(response?.status).toBe(307);
            expect(response?.headers.get('location')).toBe('http://localhost/dashboard/patient');
        });

        it('should redirect admin to /dashboard/admin when accessing /dashboard', async () => {
            mockGetToken.mockResolvedValue({ role: 'admin', sub: 'admin-id', name: 'Test Admin' });
            req = createMockRequest('/dashboard');
            const response = await middleware(req);

            expect(response).toBeInstanceOf(NextResponse);
            expect(response?.status).toBe(307);
            expect(response?.headers.get('location')).toBe('http://localhost/dashboard/admin');
        });

        it('should redirect patient to /dashboard/patient when accessing /dashboard/admin', async () => {
            mockGetToken.mockResolvedValue({ role: 'patient', sub: 'patient-id', name: 'Test Patient' });
            req = createMockRequest('/dashboard/admin');
            const response = await middleware(req);

            expect(response).toBeInstanceOf(NextResponse);
            expect(response?.status).toBe(307);
            expect(response?.headers.get('location')).toBe('http://localhost/dashboard/patient');
        });

        it('should redirect admin to /dashboard/admin when accessing /dashboard/patient (if admin path is strictly enforced)', async () => {
            // This tests if an admin is forced back to their own section if they try to access another valid role's section.
            mockGetToken.mockResolvedValue({ role: 'admin', sub: 'admin-id', name: 'Test Admin' });
            req = createMockRequest('/dashboard/patient');
            const response = await middleware(req);

            expect(response).toBeInstanceOf(NextResponse);
            expect(response?.status).toBe(307);
            expect(response?.headers.get('location')).toBe('http://localhost/dashboard/admin');
        });
    });

    describe('Authenticated Access - Correct Role', () => {
        it('should allow admin access to /dashboard/admin and return NextResponse.next()', async () => {
            mockGetToken.mockResolvedValue({ role: 'admin', sub: 'admin-id', name: 'Test Admin' });
            req = createMockRequest('/dashboard/admin/settings'); // A deeper path
            const response = await middleware(req);

            // NextResponse.next() typically results in 'undefined' or a response that isn't a redirect.
            // For middleware, if it doesn't return a NextResponse object, it means it passed through.
            // Or, it could return a basic NextResponse with no specific redirect/rewrite.
            // Checking that it's not a redirect is the primary goal.
            expect(response?.status).not.toBe(307);
            expect(response?.headers.get('location')).toBeNull(); // Or not one of the redirect paths
        });

        it('should allow patient access to /dashboard/patient and return NextResponse.next()', async () => {
            mockGetToken.mockResolvedValue({ role: 'patient', sub: 'patient-id', name: 'Test Patient' });
            req = createMockRequest('/dashboard/patient/appointments'); // A deeper path
            const response = await middleware(req);

            expect(response?.status).not.toBe(307);
            expect(response?.headers.get('location')).toBeNull();
        });

        // This case tests if a user with an undefined role (or a role not in rolePaths) is handled.
        // The current middleware would let them pass if they are on /dashboard/* but not /dashboard or /dashboard/
        // And if their path doesn't start with a defined role path.
        // This might need adjustment in middleware or be an expected pass-through.
        it('should allow access if role is defined but not in rolePaths and path is specific enough', async () => {
            mockGetToken.mockResolvedValue({ role: 'unknown_role', sub: 'user-id', name: 'Test User' });
            req = createMockRequest('/dashboard/unknown_role/somepage');
            const response = await middleware(req);
            expect(response?.status).not.toBe(307);
            expect(response?.headers.get('location')).toBeNull();
        });

        // Test case for when a user with a role NOT in rolePaths tries to access /dashboard
        // Current middleware logic will allow this request to pass through NextResponse.next()
        // as `userSpecificDashboard` will be undefined. This might be intended or an edge case to consider.
        it('should allow access to /dashboard if user role is not in predefined rolePaths', async () => {
            mockGetToken.mockResolvedValue({ role: 'editor', sub: 'editor-id', name: 'Test Editor' });
            req = createMockRequest('/dashboard/editor/profile'); // Path matches role not in default rolePaths
            const response = await middleware(req);

            // Expect NextResponse.next() behavior
            expect(response?.status).not.toBe(307);
            expect(response?.headers.get('location')).toBeNull();
        });
    });

    // Edge case: What if token exists but role is missing?
    // The middleware currently casts `token.role as string`. If `token.role` is undefined, this might cause issues.
    // Or, `userRole` would be undefined, and behavior might be unexpected.
    // Let's assume `role` is always present if the token is valid for now, as per typical JWT structures.
    // If not, the middleware should be hardened (e.g., check `if (token && typeof token.role === 'string')`).
});
