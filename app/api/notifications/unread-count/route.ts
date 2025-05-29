import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';
import { getToken } from 'next-auth/jwt';

// GET: Fetch the count of unread notifications for the authenticated user
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !token.sub) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  const userId = token.sub;

  await dbConnect();

  try {
    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
