import mongoose, { Document, Schema } from 'mongoose';

interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  message: string;
  read: boolean;
  type?: string;
  link?: string;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
  },
  link: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for user and createdAt to optimize fetching notifications for a user
NotificationSchema.index({ user: 1, createdAt: -1 });
// Index for user and read status for fetching unread notifications
NotificationSchema.index({ user: 1, read: 1 });


const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
export type { INotification };
