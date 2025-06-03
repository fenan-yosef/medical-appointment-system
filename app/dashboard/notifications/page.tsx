"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { AvatarComponent } from "@/components/ui/avatar-component"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

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
    createdAt: string
    priority: string
}

export default function NotificationsPage() {
    const { data: session } = useSession()
    const { toast } = useToast()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (session?.user) {
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

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "appointment_created":
                return "📅"
            case "appointment_cancelled":
                return "❌"
            case "appointment_rescheduled":
                return "🔄"
            case "appointment_completed":
                return "✅"
            case "reminder":
                return "⏰"
            default:
                return "📢"
        }
    }

    const isNotificationRead = (notification: Notification) => {
        const userRecipient = notification.recipients.find((recipient) => recipient.user === session?.user?.id)
        return userRecipient?.isRead || false
    }

    const formatNotificationTime = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Notifications</h1>

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
                                                    <AvatarComponent
                                                        src={notification.sender ? undefined : undefined}
                                                        firstName={notification.sender?.firstName}
                                                        lastName={notification.sender?.lastName}
                                                        size="lg"
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 text-lg">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className={`font-medium ${!isRead ? "font-semibold" : ""}`}>
                                                            {notification.sender
                                                                ? `Dr. ${notification.sender.firstName} ${notification.sender.lastName}`
                                                                : "System"}
                                                        </h3>
                                                        <span className="text-sm text-gray-500">
                                                            {formatNotificationTime(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm mt-1 ${!isRead ? "text-gray-900" : "text-gray-600"}`}>
                                                        {notification.message}
                                                    </p>
                                                    {!isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>}
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
