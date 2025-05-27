"use client"
import { useState, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react" // Import useSession
import { LayoutDashboard, Calendar, Users, FileText, Settings, LogOut, ChevronDown, Menu, X, PanelLeft, PanelRight, UserPlus, CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Define the NavItem type
interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    subItems?: NavItem[];
}

// Define lists for each role
const adminNavItems: NavItem[] = [
    {
        name: "Dashboard",
        href: "/dashboard/admin",
        icon: LayoutDashboard,
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
        subItems: [
            { name: "All Patients", href: "/dashboard/admin/patients", icon: Users },
            { name: "Add Patient", href: "/dashboard/admin/patients/add", icon: UserPlus },
        ],
    },
    {
        name: "Doctors",
        href: "/dashboard/admin/doctors",
        icon: FileText,
    },
    {
        name: "Settings",
        href: "/dashboard/admin/settings",
        icon: Settings,
    },
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
        name: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    }
]

const patientNavItems: NavItem[] = [
    {
        name: "Dashboard",
        href: "/dashboard/patient",
        icon: LayoutDashboard,
    },
    {
        name: "My Appointments",
        href: "/dashboard/patient/appointments",
        icon: Calendar,
    },
    {
        name: "My Profile",
        href: "/dashboard/patient/profile",
        icon: Users,
    },
    {
        name: "Medical Records",
        href: "/dashboard/patient/records",
        icon: FileText,
    },
    {
        name: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
]

interface SidebarProps {
    initialUser: { // Renamed user to initialUser
        name?: string | null
        email?: string | null
        role?: string | null
    }
}

export function Sidebar({ initialUser }: SidebarProps) { // Use initialUser
    const pathname = usePathname() || ""
    const { data: clientSession, status: clientStatus } = useSession() // Call useSession
    const [isOpen, setIsOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const [sidebarWidth, setSidebarWidth] = useState(256)
    const resizing = useRef(false)

    const toggleSidebar = () => setIsOpen(!isOpen)
    const closeSidebar = () => setIsOpen(false)
    const toggleCollapse = () => setCollapsed(prev => !prev)

    const handleMouseDown = (e: React.MouseEvent) => {
        resizing.current = true
        document.body.style.cursor = "col-resize"
    }
    const handleMouseMove = (e: MouseEvent) => {
        if (resizing.current) {
            const newWidth = Math.max(180, Math.min(400, e.clientX))
            setSidebarWidth(newWidth)
        }
    }
    const handleMouseUp = () => {
        resizing.current = false
        document.body.style.cursor = ""
    }
    if (typeof window !== "undefined") {
        window.onmousemove = resizing.current ? handleMouseMove : null
        window.onmouseup = resizing.current ? handleMouseUp : null
    }

    // Determine effectiveUser based on clientSession and initialUser
    let effectiveUser = initialUser;
    if (clientStatus === "authenticated" && clientSession?.user?.role) {
        effectiveUser = {
            name: clientSession.user.name || initialUser.name,
            email: clientSession.user.email || initialUser.email,
            role: clientSession.user.role, // Prioritize client-side role
        };
    } else if (clientStatus === "authenticated" && clientSession?.user) {
        effectiveUser = {
            name: clientSession.user.name || initialUser.name,
            email: clientSession.user.email || initialUser.email,
            role: initialUser.role, // Fallback to initialUser's role if client's is missing
        };
    }


    // Choose nav items based on the effectiveUser's role
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
            // console.log("Sidebar: Role not found or session loading, using default (admin) nav items. Effective user:", effectiveUser);
            currentNavItems = adminNavItems // Default fallback
    }

    return (
        <>
            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden" onClick={toggleSidebar}>
                {isOpen ? <X /> : <Menu />}
            </Button>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebar} />}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    "md:translate-x-0"
                )}
                style={{
                    width: collapsed ? 64 : sidebarWidth,
                    minWidth: collapsed ? 64 : 180,
                    maxWidth: collapsed ? 64 : 400,
                }}
            >
                <div className="flex items-center h-16 px-4 border-b border-gray-200 justify-between">
                    <div className="flex items-center space-x-2 ml-9">
                        {!collapsed && <span className="text-xl font-semibold">SDLM</span>}
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2" onClick={toggleCollapse} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
                        {collapsed ? <PanelRight /> : <PanelLeft />}
                    </Button>
                </div>
                <nav className={cn("flex-1 overflow-y-auto py-4", collapsed ? "px-1" : "px-3")}>
                    <ul className="space-y-1">
                        {currentNavItems.map(item => {
                            const isActive = pathname === item.href || (item.href && pathname.startsWith(`${item.href}/`))
                            return (
                                <li key={item.name}>
                                    {item.subItems ? (
                                        <div className="mb-2">
                                            <button
                                                className={cn(
                                                    "flex items-center w-full px-2 py-2 text-sm font-medium rounded-md",
                                                    isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100",
                                                    collapsed && "justify-center"
                                                )}
                                            >
                                                <item.icon className="mr-0 md:mr-3 h-5 w-5" />
                                                {!collapsed && <span>{item.name}</span>}
                                                {!collapsed && <ChevronDown className="ml-auto h-4 w-4" />}
                                            </button>
                                            {!collapsed && item.subItems && (
                                                <ul className="mt-1 pl-10 space-y-1">
                                                    {item.subItems.map(subItem => (
                                                        <li key={subItem.name}>
                                                            <Link
                                                                href={subItem.href}
                                                                className={cn(
                                                                    "block px-3 py-2 text-sm font-medium rounded-md",
                                                                    pathname === subItem.href ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                                                                )}
                                                                onClick={closeSidebar}
                                                            >
                                                                {subItem.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                                                isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100",
                                                collapsed && "justify-center"
                                            )}
                                            onClick={closeSidebar}
                                        >
                                            <item.icon className="mr-0 md:mr-3 h-5 w-5" />
                                            {!collapsed && <span>{item.name}</span>}
                                        </Link>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </nav>
                {!collapsed && <div className="absolute top-0 right-0 h-full w-2 cursor-col-resize z-50" onMouseDown={handleMouseDown} style={{ userSelect: "none" }} />}
                <div className={cn("p-4 border-t border-gray-200 flex items-center", collapsed && "justify-center p-2")}>
                    <div className="flex items-center w-full">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">{effectiveUser?.name?.charAt(0) || "U"}</span>
                            </div>
                        </div>
                        {!collapsed && (
                            <div className="ml-3 min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{effectiveUser?.name || "User"}</p>
                                <p className="text-xs text-gray-500 truncate">{effectiveUser?.email || "user@example.com"}</p>
                            </div>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })} title="Logout">
                            <LogOut className="h-5 w-5 text-gray-500" />
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    )
}
