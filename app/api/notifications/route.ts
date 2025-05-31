import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { getToken } from 'next-auth/jwt';

// GET: Fetch notifications for the currently authenticated user
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !token.sub) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  const userId = token.sub;

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const readParam = searchParams.get('read');

    const query: any = { user: userId };

    if (readParam !== null) {
      query.read = readParam === 'true';
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalNotifications = await Notification.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: notifications,
      totalPages: Math.ceil(totalNotifications / limit),
      currentPage: page,
      totalNotifications,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Create a new notification (placeholder/restricted)
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !token.sub) { // Basic auth check
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }

  // For now, this endpoint is a placeholder or might be restricted to admin roles in the future.
  // Actual notification creation will likely be handled by specific system events (e.g., new appointment).

  // Example: Allow admin to create notifications
  // if (token.role !== 'admin') {
  //   return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  // }

  // try {
  //   const body = await request.json();
  //   const { user, message, type, link } = body;

  //   if (!user || !message) {
  //     return NextResponse.json({ success: false, error: 'User and message are required' }, { status: 400 });
  //   }

  //   await dbConnect();
  //   const newNotification = new Notification({
  //     user,
  //     message,
  //     type,
  //     link,
  //   });
  //   await newNotification.save();
  //   return NextResponse.json({ success: true, data: newNotification }, { status: 201 });

  // } catch (error: any) {
  //   return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  // }

  return NextResponse.json({ success: false, message: 'Direct notification creation is not implemented or restricted.' }, { status: 501 });
}
