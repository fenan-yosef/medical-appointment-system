import * as React from "react";
import type { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { Sidebar } from "@/components/sidebar";
import DashboardClientLayoutWrapper from "./DashboardClientLayoutWrapper"; // Import the wrapper

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(); // Session for server components like Sidebar

    return (
        <div className="flex min-h-screen">
            {/* Sidebar can still use server-fetched session if it's a server component */}
            <Sidebar user={session?.user || {}} />
            <main className="flex-1 ml-0 md:ml-64 bg-gray-50 p-4">
                {/* Wrap children with the client component that handles DashboardRoleGuard */}
                <DashboardClientLayoutWrapper>
                    {children}
                </DashboardClientLayoutWrapper>
            </main>
        </div>
    );
}