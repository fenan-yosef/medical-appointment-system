"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function RolePathGuard({ role, userRole }: { role?: string, userRole?: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const currentPath = role ? "/dashboard/" + role : undefined;

    useEffect(() => {
        if (!userRole || !pathname) return;

        // Extract the dashboard role from the path (e.g., /dashboard/patient/...)
        const match = pathname.match(/^\/dashboard\/([^\/]+)/);
        const pathRole = match ? match[1] : undefined;

        if (!pathRole || pathRole !== userRole) {
            // Always redirect to the correct dashboard for the user's role
            router.replace(`/dashboard/${userRole}`);
            return;
        }

        // Optionally, keep the currentPath check if you want to restrict sub-paths
        // if (currentPath && !pathname.startsWith(currentPath)) {
        //     router.replace(currentPath);
        // }
    }, [pathname, router, userRole]);

    return null;
}
