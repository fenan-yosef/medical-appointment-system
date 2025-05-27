"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

interface DashboardRoleGuardProps {
  userRole?: string; // Role from session
}

export default function DashboardRoleGuard({ userRole }: DashboardRoleGuardProps) {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!userRole || !pathname) {
            // If userRole is not yet available, or pathname is not available, do nothing.
            // Session loading might be in progress.
            return;
        }

        // Extract the role segment from the pathname (e.g., "admin" from "/dashboard/admin/settings")
        // Pathname should be like /dashboard/role/...
        const pathSegments = pathname.split('/'); // e.g., ["", "dashboard", "admin", "settings"]
        const pathRole = pathSegments.length > 2 ? pathSegments[2] : undefined;

        // 1. If the pathname is exactly /dashboard or /dashboard/
        if (pathname === "/dashboard" || pathname === "/dashboard/") {
            router.replace(`/dashboard/${userRole}`);
            return;
        }

        // 2. If the extracted role from the pathname does not match userRole
        // (and it's a dashboard path that should have a role)
        if (pathSegments[1] === "dashboard" && pathRole !== userRole) {
            router.replace(`/dashboard/${userRole}`);
            return;
        }

    }, [pathname, router, userRole]);

    return null; // This component does not render anything
}
