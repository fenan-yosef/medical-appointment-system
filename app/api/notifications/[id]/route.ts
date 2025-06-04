import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

// Define the expected shape of the resolved params
interface ResolvedParams {
  id: string | string[] | undefined;
}

// Define the context type for route handlers
interface RouteContext {
  params: Promise<ResolvedParams>;
}

// PUT: Mark a specific notification as read
export async function PUT(request: NextRequest, context: RouteContext) {
  const token = await getToken({ req: request });
  if (!token || !token.sub) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  const userId = token.sub;

  const resolvedParams = await context.params;
  const notificationIdFromParams = resolvedParams.id;

  if (typeof notificationIdFromParams !== 'string' || !mongoose.Types.ObjectId.isValid(notificationIdFromParams)) {
    return NextResponse.json({ message: 'Invalid notification ID format' }, { status: 400 });
  }
  const notificationId = notificationIdFromParams; // notificationId is now a validated string

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
