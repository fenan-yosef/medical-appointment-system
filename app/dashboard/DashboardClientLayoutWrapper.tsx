"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import DashboardRoleGuard from "./DashboardRoleGuard"; // Adjusted path
import { Sidebar } from "@/components/sidebar"; // Assuming sidebar is okay in client component or needs adjustment

export default function DashboardClientLayoutWrapper({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();

    // The role could be nested, adjust if necessary, e.g., session.user.role
    // Making sure to handle cases where session or user might be undefined.
    const userRole = session?.user?.role as string | undefined;

    if (status === "loading") {
        return <div>Loading session...</div>; // Or a proper skeleton loader
    }

    // Although middleware handles unauthenticated access to /dashboard/*,
    // session status check here is good practice for client components.
    // If status is "unauthenticated", next-auth typically handles redirection via its providers/callbacks
    // or the middleware would have already redirected.

    return (
        <>
            {/* Pass userRole only if session is authenticated and role exists */}
            {status === "authenticated" && userRole && <DashboardRoleGuard userRole={userRole} />}
            {/* 
              The Sidebar might also need session information.
              If Sidebar is a server component or needs to be one, this structure needs rethinking.
              For now, assuming Sidebar can work as is or is adaptable.
              If session.user is directly passed to Sidebar, ensure it's correctly typed.
            */}
            {/* It's unusual to re-declare Sidebar and main structure here if it's already in server layout */}
            {/* The purpose of this wrapper is primarily for the DashboardRoleGuard and session handling */}
            {children}
        </>
    );
}
