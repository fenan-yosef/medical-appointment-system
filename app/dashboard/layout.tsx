import * as React from "react";
import type { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession();

    return (
        <div className="flex min-h-screen">
            <Sidebar user={session?.user || {}} />
            <main className="flex-1 ml-0 md:ml-64 bg-gray-50 p-4">
                {children}
            </main>
        </div>
    );
}