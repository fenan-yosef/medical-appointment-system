import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Calendar, Stethoscope, FileText, BarChart2, Settings, Bell, UserCog, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const adminSections = [
    {
        title: "User Management",
        description: "Manage patients, doctors, and staff accounts.",
        icon: Users,
        href: "/dashboard/admin/users",
    },
    {
        title: "Appointments",
        description: "View, approve, or manage all appointments.",
        icon: Calendar,
        href: "/dashboard/admin/appointments",
    },
    {
        title: "Doctors",
        description: "Add, edit, or remove doctor profiles and schedules.",
        icon: Stethoscope,
        href: "/dashboard/admin/doctors",
    },
    {
        title: "Departments",
        description: "Manage medical departments and assignments.",
        icon: UserCog,
        href: "/dashboard/admin/departments",
    },
    {
        title: "Reports",
        description: "Generate and download system reports.",
        icon: FileText,
        href: "/dashboard/admin/reports",
    },
    {
        title: "Analytics",
        description: "View statistics and trends.",
        icon: BarChart2,
        href: "/dashboard/admin/analytics",
    },
    {
        title: "Notifications",
        description: "Send announcements to users.",
        icon: Bell,
        href: "/dashboard/admin/notifications",
    },
    {
        title: "Settings",
        description: "Configure system settings and policies.",
        icon: Settings,
        href: "/dashboard/admin/settings",
    },
    {
        title: "Audit Logs",
        description: "View admin activity logs.",
        icon: ShieldCheck,
        href: "/dashboard/admin/audit-logs",
    },
];

export default async function AdminDashboardPage() {
    const session = await getServerSession();

    if (!session?.user) {
        redirect("/login");
    }
    if (session.user.role === "patient") {
        redirect("/dashboard/patient");
    }

    return (
        <div className="max-w-6xl mx-auto py-8 px-2 md:px-0">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {adminSections.map((section) => (
                    <Link key={section.title} href={section.href}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <section.icon className="h-8 w-8 text-blue-600" />
                                <div>
                                    <CardTitle>{section.title}</CardTitle>
                                    <CardDescription>{section.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="text-right">
                                <span className="text-blue-600 font-semibold">Go</span>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
