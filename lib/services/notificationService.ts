import Notification from "@/models/Notification"
import User from "@/models/User"
import dbConnect from "@/lib/db"

interface CreateNotificationParams {
    title: string
    message: string
    type: string
    senderId?: string
    recipientIds: string[]
    relatedEntity?: {
        entityType: string
        entityId: string
    }
    priority?: string
}

export class NotificationService {
    static async createNotification({
        title,
        message,
        type,
        senderId,
        recipientIds,
        relatedEntity,
        priority = "medium",
    }: CreateNotificationParams) {
        await dbConnect()

        try {
            // Get recipient details to include role information
            const recipients = await User.find({ _id: { $in: recipientIds } }).select("_id role")

            const recipientData = recipients.map((recipient) => ({
                user: recipient._id,
                role: recipient.role,
                isRead: false,
            }))

            const notification = new Notification({
                title,
                message,
                type,
                sender: senderId,
                recipients: recipientData,
                relatedEntity,
                priority,
            })

            await notification.save()
            return notification
        } catch (error) {
            console.error("Error creating notification:", error)
            throw error
        }
    }

    static async createAppointmentNotification(appointmentData: any, type: string) {
        await dbConnect()

        try {
            // Get admin users
            const adminUsers = await User.find({ role: "admin", isActive: true }).select("_id")
            const adminIds = adminUsers.map((admin) => admin._id.toString())

            // Include the doctor
            const recipientIds = [...adminIds, appointmentData.doctor]

            let title = ""
            let message = ""

            switch (type) {
                case "appointment_created":
                    title = "New Appointment Scheduled"
                    message = `A new appointment has been scheduled for ${appointmentData.date}`
                    break
                case "appointment_cancelled":
                    title = "Appointment Cancelled"
                    message = `An appointment scheduled for ${appointmentData.date} has been cancelled`
                    break
                case "appointment_rescheduled":
                    title = "Appointment Rescheduled"
                    message = `An appointment has been rescheduled to ${appointmentData.date}`
                    break
                default:
                    title = "Appointment Update"
                    message = "An appointment has been updated"
            }

            return await this.createNotification({
                title,
                message,
                type,
                senderId: appointmentData.patient,
                recipientIds,
                relatedEntity: {
                    entityType: "appointment",
                    entityId: appointmentData._id || appointmentData.id,
                },
                priority: "medium",
            })
        } catch (error) {
            console.error("Error creating appointment notification:", error)
            throw error
        }
    }

    static async markAsRead(notificationId: string, userId: string) {
        await dbConnect()

        try {
            const notification = await Notification.findOneAndUpdate(
                {
                    _id: notificationId,
                    "recipients.user": userId,
                },
                {
                    $set: {
                        "recipients.$.isRead": true,
                        "recipients.$.readAt": new Date(),
                    },
                },
                { new: true },
            )

            return notification
        } catch (error) {
            console.error("Error marking notification as read:", error)
            throw error
        }
    }

    static async getUserNotifications(userId: string, page = 1, limit = 20) {
        await dbConnect()

        try {
            const notifications = await Notification.find({
                "recipients.user": userId,
            })
                .populate("sender", "firstName lastName role")
                .populate("relatedEntity.entityId")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)

            return notifications
        } catch (error) {
            console.error("Error fetching user notifications:", error)
            throw error
        }
    }
}
