"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { RealTimeService } from "@/lib/services/realTimeService"

interface RealTimeNotificationsProps {
    onNewNotification?: (notification: any) => void
}

export function RealTimeNotifications({ onNewNotification }: RealTimeNotificationsProps) {
    const { data: session } = useSession()
    const { toast } = useToast()

    useEffect(() => {
        if (session?.user?.id) {
            // Connect to real-time notifications
            RealTimeService.connect(session.user.id)

            // Subscribe to notification events
            RealTimeService.subscribe("notification", (data) => {
                const notification = data.data

                // Show toast notification
                toast({
                    title: notification.title,
                    description: notification.message,
                })

                // Call callback if provided
                if (onNewNotification) {
                    onNewNotification(notification)
                }
            })

            // Subscribe to appointment updates
            RealTimeService.subscribe("appointment_update", (data) => {
                toast({
                    title: "Appointment Update",
                    description: data.message,
                })
            })

            return () => {
                RealTimeService.disconnect()
            }
        }
    }, [session, toast, onNewNotification])

    return null // This component doesn't render anything
}
