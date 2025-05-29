"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Calendar, Users, FileText, Settings, LogOut, ChevronDown, Menu, X, PanelLeft, PanelRight, PanelRightOpen, PanelLeftClose, UserPlus, CalendarPlus, Briefcase, Bell } from "lucide-react" // Added Briefcase, Bell
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Modify the NavItem type to include an optional className
interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    subItems?: NavItem[];
}

interface SidebarProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
        role?: string | null // Added role
    }
}

export function AdminSidebar({ user }: SidebarProps) {
    const pathname = usePathname() || ""
    const [isOpen, setIsOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const [sidebarWidth, setSidebarWidth] = useState(256) // 64 * 4 = 256px (default w-64)
    const resizing = useRef(false)

    const toggleSidebar = () => setIsOpen(!isOpen)
    const closeSidebar = () => setIsOpen(false)
    const toggleCollapse = () => setCollapsed((c) => !c)

    // Handle drag to resize
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
    // Attach/detach listeners
    if (typeof window !== "undefined") {
        window.onmousemove = resizing.current ? handleMouseMove : null
        window.onmouseup = resizing.current ? handleMouseUp : null
    }

    let currentNavItems: NavItem[] = []; // Explicitly type currentNavItems

    const defaultNavItems: NavItem[] = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            name: "Appointments",
            href: "/dashboard/appointments",
            icon: Calendar,
            subItems: [
                { name: "All Appointments", href: "/dashboard/appointments", icon: Calendar },
                { name: "Add Appointment", href: "/dashboard/appointments/add", icon: CalendarPlus },
                { name: "Calendar View", href: "/dashboard/appointments/calendar", icon: Calendar },
            ],
        },
        {
            name: "Patients",
            href: "/dashboard/patients",
            icon: Users,
            subItems: [
                { name: "All Patients", href: "/dashboard/patients", icon: Users },
                { name: "Add Patient", href: "/dashboard/patients/add", icon: UserPlus },
            ],
        },
        {
            name: "Manage Services",
            href: "/dashboard/admin/services",
            icon: Briefcase, 
        },
        {
            name: "Notifications",
            href: "/dashboard/notifications",
            icon: Bell,
        },
        {
            name: "Reports",
            href: "/dashboard/reports",
            icon: FileText,
        },
        {
            name: "Settings",
            href: "/dashboard/settings",
            icon: Settings,
        },
    ];

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
        },
    ];

    if (user?.role === "receptionist") {
        currentNavItems = receptionistNavItems;
    } else if (user?.role === "admin") {
        currentNavItems = defaultNavItems;
    } else {
        currentNavItems = defaultNavItems;
    }

    return (
        <>
            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden" onClick={toggleSidebar}>
                {isOpen ? <X /> : <Menu />}
            </Button>

            {/* Overlay for mobile */}
            {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeSidebar} />}

            {/* Sidebar */}
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
                        {/* <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold">S</span>
                        </div> */}
                        {!collapsed && <span className="text-xl font-semibold">SDLM</span>}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2"
                        onClick={toggleCollapse}
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <PanelRight /> : <PanelLeft />}
                    </Button>
                </div>

                {/* Navigation */}
                <nav className={cn("flex-1 overflow-y-auto py-4", collapsed ? "px-1" : "px-3")}>
                    <ul className="space-y-1">
                        {currentNavItems.map((item) => {
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
                                            {!collapsed && (
                                                <ul className="mt-1 pl-10 space-y-1">
                                                    {item.subItems.map((subItem: NavItem) => (
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

                {/* Resize handle */}
                {!collapsed && (
                    <div
                        className="absolute top-0 right-0 h-full w-2 cursor-col-resize z-50"
                        onMouseDown={handleMouseDown}
                        style={{ userSelect: "none" }}
                    />
                )}

                {/* User profile and logout */}
                <div className={cn("p-4 border-t border-gray-200 flex items-center", collapsed && "justify-center p-2")}>
                    <div className="flex items-center w-full">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">{user?.name?.charAt(0) || "U"}</span>
                            </div>
                        </div>
                        {!collapsed && (
                            <div className="ml-3 min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "User"}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email || "user@example.com"}</p>
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
