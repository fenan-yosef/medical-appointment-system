"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
    LayoutDashboard,
    Calendar,
    Users,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    UserPlus,
    CalendarPlus,
    MessageCircle,
    HeartPulse,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Define the NavItem type
interface NavItem {
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
}

// Define lists for each role
const adminNavItems: NavItem[] = [
    {
        name: "Dashboard",
        href: "/dashboard/admin",
        icon: LayoutDashboard,
    },
    {
        name: "Services",
        href: "/dashboard/admin/services",
        icon: HeartPulse,
    },
    {
        name: "Appointments",
        href: "/dashboard/admin/appointments",
        icon: Calendar,
    },
    {
        name: "Patients",
        href: "/dashboard/admin/patients",
        icon: Users,
    },
    {
        name: "Doctors",
        href: "/dashboard/admin/doctors",
        icon: FileText,
    },
    {
        name: "My Profile",
        href: "/dashboard/profile",
        icon: Users,
    },
    // {
    //     name: "Settings",
    //     href: "/dashboard/admin/settings",
    //     icon: Settings,
    // },
]

const receptionistNavItems: NavItem[] = [
    {
        name: "Dashboard",
        href: "/dashboard/receptionist",
        icon: LayoutDashboard,
    },
    {
        name: "Add Patient",
        href: "/dashboard/receptionist/add-patient",
        icon: UserPlus,
    },
    {
        name: "Schedule Appointment",
        href: "/dashboard/receptionist/schedule-appointment",
        icon: CalendarPlus,
    },
    {
        name: "Messages",
        href: "/dashboard/receptionist/messages",
        icon: MessageCircle,
    },
    {
        name: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
]

const patientNavItems: NavItem[] = [
    // {
    //     name: "Dashboard",
    //     href: "/dashboard/patient",
    //     icon: LayoutDashboard,
    // },
    {
        name: "My Appointments",
        href: "/dashboard/patient",
        icon: Calendar,
    },
    {
        name: "My Profile",
        href: "/dashboard/profile",
        icon: Users,
    },
    {
        name: "Medical Records",
        href: "/dashboard/patient/records",
        icon: FileText,
    },
    {
        name: "Messages",
        href: "/dashboard/patient/messages",
        icon: MessageCircle,
    },
    {
        name: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
]

interface SidebarProps {
    user: {
        name?: string | null
        email?: string | null
        role?: string | null
    }
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname() || ""
    const { data: clientSession, status: clientStatus } = useSession()
    const [isOpen, setIsOpen] = useState(false)

    const toggleSidebar = () => setIsOpen(!isOpen)
    const closeSidebar = () => setIsOpen(false)

    // Determine effective user
    let effectiveUser = user
    if (clientStatus === "authenticated" && clientSession?.user?.role) {
        effectiveUser = {
            name: clientSession.user.name || user.name,
            email: clientSession.user.email || user.email,
            role: clientSession.user.role,
        }
    } else if (clientStatus === "authenticated" && clientSession?.user) {
        effectiveUser = {
            name: clientSession.user.name || user.name,
            email: clientSession.user.email || user.email,
            role: user.role,
        }
    }

    // Choose nav items based on role
    let currentNavItems: NavItem[] = []
    switch (effectiveUser?.role) {
        case "admin":
            currentNavItems = adminNavItems
            break
        case "receptionist":
            currentNavItems = receptionistNavItems
            break
        case "patient":
            currentNavItems = patientNavItems
            break
        default:
            currentNavItems = adminNavItems
    }

    // Get user title based on role
    const getUserTitle = (role: string | null | undefined) => {
        switch (role) {
            case "admin":
                return "Administrator"
            case "receptionist":
                return "Receptionist"
            case "patient":
                return "Patient"
            default:
                return "User"
        }
    }

    return (
        <>
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-md"
                onClick={toggleSidebar}
            >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Mobile overlay */}
            {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebar} />}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    "md:translate-x-0",
                )}
            >
                {/* Profile Section */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img
                                src={`https://picsum.photos/seed/${effectiveUser?.name || "user"}/40/40`}
                                alt={effectiveUser?.name || "User"}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{effectiveUser?.name || "User Name"}</h3>
                            <p className="text-xs text-gray-500 truncate">{getUserTitle(effectiveUser?.role)}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {currentNavItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={closeSidebar}
                                className={cn(
                                    "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                    isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                )}
                            >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-4 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Logout
                    </Button>
                </div>
            </aside>
        </>
    )
}
