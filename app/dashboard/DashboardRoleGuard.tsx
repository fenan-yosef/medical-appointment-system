"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface DashboardRoleGuardProps {
    userRole?: string; // Role from session
}

// Define known roles to differentiate them from shared path segments like "profile"
const KNOWN_USER_ROLES = ["admin", "doctor", "receptionist", "patient"];

export default function DashboardRoleGuard({ userRole }: DashboardRoleGuardProps) {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!userRole || !pathname) {
            return;
        }

        const pathSegments = pathname.split('/'); // e.g., ["", "dashboard", "profile"] or ["", "dashboard", "admin", "settings"]
        const baseSegment = pathSegments.length > 1 ? pathSegments[1] : undefined; // Should be "dashboard"
        const roleOrSharedSegment = pathSegments.length > 2 ? pathSegments[2] : undefined; // e.g., "profile", "admin"

        // 1. If the pathname is exactly /dashboard or /dashboard/, redirect to user's role-specific root
        if (pathname === "/dashboard" || pathname === "/dashboard/") {
            router.replace(`/dashboard/${userRole}`);
            return;
        }

        // 2. If it's a dashboard path, and the segment after "dashboard" is a KNOWN_USER_ROLE,
        //    and that role segment does not match the actual user's role, then redirect.
        //    This prevents, for example, a "patient" from accessing "/dashboard/admin/*".
        //    It allows paths like "/dashboard/profile" because "profile" is not in KNOWN_USER_ROLES.
        if (
            baseSegment === "dashboard" &&
            roleOrSharedSegment &&
            KNOWN_USER_ROLES.includes(roleOrSharedSegment) && // Check if it's an actual role segment
            roleOrSharedSegment !== userRole
        ) {
            router.replace(`/dashboard/${userRole}`);
            return;
        }

    }, [pathname, router, userRole]);

    return null; // This component does not render anything
}
