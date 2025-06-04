"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Search, Mail, CheckCircle } from "lucide-react" // Added Mail, CheckCircle
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup, // Added DropdownMenuGroup
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge" // Assuming Badge component exists
import { useToast } from "@/hooks/use-toast" // For showing messages
import { useRouter } from "next/navigation"; // For navigation on link click


// Types for Notification
interface INotification {
    _id: string;
    message: string;
    read: boolean;
    type?: string;
    link?: string;
    createdAt: string; // ISO Date string
    user: string; // User ID
}


interface HeaderProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export function Header({ user }: HeaderProps) {
    const pathname = usePathname() || ""
    const router = useRouter();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");

    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [isLoadingUnreadCount, setIsLoadingUnreadCount] = useState(false);

    const fetchUnreadCount = async () => {
        setIsLoadingUnreadCount(true);
        try {
            const response = await fetch('/api/notifications/unread-count');
            if (!response.ok) throw new Error('Failed to fetch unread count');
            const data = await response.json();
            if (data.success) {
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
            // Optionally show a toast error
        } finally {
            setIsLoadingUnreadCount(false);
        }
    };

    const fetchNotifications = async () => {
        if (!isNotificationDropdownOpen) return; // Only fetch when dropdown is open
        setIsLoadingNotifications(true);
        try {
            const response = await fetch('/api/notifications?limit=7&sortOrder=desc'); // Fetch 7 recent ones
            if (!response.ok) throw new Error('Failed to fetch notifications');
            const data = await response.json();
            if (data.success) {
                setNotifications(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast({ title: "Error", description: "Could not load notifications.", variant: "destructive" });
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        // Optional: Set up polling for unread count
        // const intervalId = setInterval(fetchUnreadCount, 30000); // every 30s
        // return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (isNotificationDropdownOpen) {
            fetchNotifications();
        }
    }, [isNotificationDropdownOpen]);


    const handleMarkAsRead = async (notificationId: string, link?: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, { method: 'PUT' });
            if (!response.ok) throw new Error('Failed to mark as read');
            const result = await response.json();
            if (result.success) {
                setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, read: true } : n));
                fetchUnreadCount(); // Refresh count
                if (link) {
                    router.push(link);
                }
                setIsNotificationDropdownOpen(false); // Close dropdown after action
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
            toast({ title: "Error", description: "Could not update notification.", variant: "destructive" });
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/mark-all-as-read', { method: 'PUT' });
            if (!response.ok) throw new Error('Failed to mark all as read');
            const result = await response.json();
            if (result.success) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
                toast({ title: "Success", description: "All notifications marked as read." });
                // fetchUnreadCount(); // already set to 0
                // fetchNotifications(); // refresh list if needed, or rely on current update
            }
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            toast({ title: "Error", description: "Could not mark all as read.", variant: "destructive" });
        }
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    // Generate breadcrumbs from pathname
    const generateBreadcrumbs = () => {
        const paths = pathname.split("/").filter(Boolean)

        return paths.map((path, index) => {
            const href = `/${paths.slice(0, index + 1).join("/")}`
            const isLast = index === paths.length - 1
            const label = path.charAt(0).toUpperCase() + path.slice(1)

            return {
                href,
                label,
                isLast,
            }
        })
    }

    const breadcrumbs = generateBreadcrumbs()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        console.log("Searching for:", searchQuery)
        // Implement search functionality
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center bg-white border-b border-gray-200 px-4 md:px-6">
            {/* Breadcrumbs - hidden on mobile */}
            <div className="hidden md:flex items-center space-x-1 text-sm">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                    Home
                </Link>
                {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center">
                        <span className="mx-1 text-gray-400">/</span>
                        {crumb.isLast ? (
                            <span className="font-medium text-gray-900">{crumb.label}</span>
                        ) : (
                            <Link href={crumb.href} className="text-gray-500 hover:text-gray-700">
                                {crumb.label}
                            </Link>
                        )}
                    </div>
                ))}
            </div>

            {/* Search - grows to fill space */}
            <div className="flex-1 mx-4">
                <form onSubmit={handleSearch} className="relative max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full bg-gray-50 pl-9 focus:bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-2">
                {/* Notification Dropdown */}
                <DropdownMenu open={isNotificationDropdownOpen} onOpenChange={setIsNotificationDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <Badge variant="destructive" className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center text-xs p-1">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 md:w-96">
                        <DropdownMenuLabel className="flex justify-between items-center">
                            <span>Notifications</span>
                            {notifications.some(n => !n.read) && (
                                <Button variant="link" size="sm" onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }} className="text-xs p-0 h-auto">
                                    Mark all as read
                                </Button>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isLoadingNotifications ? (
                            <DropdownMenuItem disabled>Loading notifications...</DropdownMenuItem>
                        ) : notifications.length === 0 ? (
                            <DropdownMenuItem disabled>No new notifications.</DropdownMenuItem>
                        ) : (
                            <DropdownMenuGroup className="max-h-80 overflow-y-auto">
                                {notifications.map((notification) => (
                                    <DropdownMenuItem
                                        key={notification._id}
                                        onClick={() => handleMarkAsRead(notification._id, notification.link)}
                                        className={`flex items-start gap-2 ${!notification.read ? 'font-semibold' : 'text-gray-600'}`}
                                    >
                                        <div className={`mt-1 h-2 w-2 rounded-full ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                        <div className="flex-1">
                                            <p className="text-sm leading-snug">{notification.message}</p>
                                            <p className="text-xs text-gray-500">{formatRelativeTime(notification.createdAt)}</p>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/notifications" className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-800">
                                View All Notifications
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">{user?.name?.charAt(0) || "U"}</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            <div className="flex flex-col">
                                <span>{user?.name || "User"}</span>
                                <span className="text-xs font-normal text-gray-500">{user?.email || "user@example.com"}</span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/profile">Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings">Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/api/auth/signout">Logout</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
