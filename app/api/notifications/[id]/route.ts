import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

interface Params {
  id: string;
}

// PUT: Mark a specific notification as read
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const token = await getToken({ req: request });
  if (!token || !token.sub) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  const userId = token.sub;
  const { id: notificationId } = params;

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return NextResponse.json({ message: 'Invalid notification ID format' }, { status: 400 });
  }

  await dbConnect();

  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId, // Ensure the notification belongs to the authenticated user
    });

    if (!notification) {
      return NextResponse.json({ message: 'Notification not found or access denied' }, { status: 404 });
    }

    if (notification.read) {
      return NextResponse.json({ success: true, message: 'Notification was already marked as read', data: notification });
    }

    notification.read = true;
    await notification.save();

    return NextResponse.json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
