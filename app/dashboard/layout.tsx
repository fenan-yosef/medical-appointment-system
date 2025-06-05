// app/layout.tsx
import * as React from "react";
import type { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
// import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"; // REMOVE THIS IMPORT
import Providers from "@/components/providers"; // Import your new client component
import { Sidebar } from "@/components/sidebar";
import DashboardClientLayoutWrapper from "./DashboardClientLayoutWrapper";
// import DeviceAnalytics from "@/components/DeviceAnalytics"; // DeviceAnalytics is likely in the root app/layout.tsx
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) { // Renamed for clarity, but RootLayout is also fine
    const session = await getServerSession(authOptions);

    console.log("DashboardLayout session:", session); // Updated log for clarity

    return (
        // Remove <html> and <body> tags from here
        <Providers session={session}>
            <div className="flex min-h-screen">
                {/* Sidebar here is fine if it's a Server Component and doesn't use client-side hooks */}
                {/* If Sidebar needs useSession, it should be moved inside DashboardClientLayoutWrapper or become a client component itself */}
                <Sidebar user={session?.user || {}} />
                <main className="flex-1 ml-0 md:ml-64 bg-gray-50 p-4">
                    {/* <DeviceAnalytics /> */} {/* This is usually in the root layout */}
                    <DashboardClientLayoutWrapper>
                        {children}
                    </DashboardClientLayoutWrapper>
                </main>
            </div>
        </Providers>
    );
}