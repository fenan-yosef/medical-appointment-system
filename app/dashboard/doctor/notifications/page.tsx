"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Bell, Calendar, X, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Notification {
    _id: string
    title: string
    message: string
    type: string
    sender?: {
        _id: string
        firstName: string
        lastName: string
        role: string
    }
    recipients: Array<{
        user: string
        role: string
        isRead: boolean
        readAt?: string
    }>
    relatedEntity?: {
        entityType: string
        entityId: string
    }
    createdAt: string
    priority: string
}

export default function DoctorNotificationsPage() {
    const { data: session } = useSession()
    const { toast } = useToast()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (session?.user?.role === "doctor") {
            fetchNotifications()
        }
    }, [session])

    const fetchNotifications = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/notifications")
            const data = await response.json()

            if (data.success) {
                setNotifications(data.data)
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to fetch notifications",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch notifications",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: "PUT",
            })

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((notification) => {
                        if (notification._id === notificationId) {
                            return {
                                ...notification,
                                recipients: notification.recipients.map((recipient) =>
                                    recipient.user === session?.user?.id ? { ...recipient, isRead: true } : recipient,
                                ),
                            }
                        }
                        return notification
                    }),
                )
            }
        } catch (error) {
            console.error("Error marking notification as read:", error)
        }
    }

    const markAllAsRead = async () => {
        const unreadNotifications = notifications.filter((notification) => {
            const userRecipient = notification.recipients.find((recipient) => recipient.user === session?.user?.id)
            return !userRecipient?.isRead
        })

        for (const notification of unreadNotifications) {
            await markAsRead(notification._id)
        }

        toast({
            title: "Success",
            description: "All notifications marked as read",
        })
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "appointment_created":
                return <Calendar className="h-5 w-5 text-blue-600" />
            case "appointment_cancelled":
                return <X className="h-5 w-5 text-red-600" />
            case "appointment_rescheduled":
                return <Calendar className="h-5 w-5 text-yellow-600" />
            case "appointment_completed":
                return <CheckCircle className="h-5 w-5 text-green-600" />
            default:
                return <Bell className="h-5 w-5 text-gray-600" />
        }
    }

    const isNotificationRead = (notification: Notification) => {
        const userRecipient = notification.recipients.find((recipient) => recipient.user === session?.user?.id)
        return userRecipient?.isRead || false
    }

    const formatNotificationTime = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    }

    const unreadCount = notifications.filter((notification) => !isNotificationRead(notification)).length

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Notifications</h1>
                        <p className="text-gray-600">
                            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All notifications read"}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button onClick={markAllAsRead} variant="outline">
                            Mark all as read
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No notifications yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => {
                            const isRead = isNotificationRead(notification)
                            return (
                                <div
                                    key={notification._id}
                                    className={`cursor-pointer transition-all hover:shadow-md ${!isRead ? "border-blue-500 bg-blue-50/50" : ""}`}
                                    onClick={() => !isRead && markAsRead(notification._id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            !isRead && markAsRead(notification._id)
                                        }
                                    }}
                                >
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="relative">
                                                    <div className="p-2 bg-gray-100 rounded-full">{getNotificationIcon(notification.type)}</div>
                                                    {!isRead && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className={`font-medium ${!isRead ? "font-semibold" : ""}`}>{notification.title}</h3>
                                                        <span className="text-sm text-gray-500">
                                                            {formatNotificationTime(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm mt-1 ${!isRead ? "text-gray-900" : "text-gray-600"}`}>
                                                        {notification.message}
                                                    </p>
                                                    {notification.priority === "high" && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                                                            High Priority
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
