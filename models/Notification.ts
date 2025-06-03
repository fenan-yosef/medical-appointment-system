import mongoose from "mongoose"

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      "appointment_created",
      "appointment_cancelled",
      "appointment_rescheduled",
      "appointment_completed",
      "system",
      "reminder",
    ],
    required: true,
  },
  // Reference to the related entity (appointment, user, etc.)
  relatedEntity: {
    entityType: {
      type: String,
      enum: ["appointment", "user", "system"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedEntity.entityType",
    },
  },
  // Sender information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // Recipients with individual read status
  recipients: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["admin", "doctor", "patient", "receptionist"],
        required: true,
      },
      isRead: {
        type: Boolean,
        default: false,
      },
      readAt: {
        type: Date,
      },
    },
  ],
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Index for efficient queries
NotificationSchema.index({ "recipients.user": 1, createdAt: -1 })
NotificationSchema.index({ type: 1, createdAt: -1 })

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema)
