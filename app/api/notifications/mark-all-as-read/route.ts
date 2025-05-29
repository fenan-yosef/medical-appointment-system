import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';
import { getToken } from 'next-auth/jwt';

// PUT: Mark all unread notifications as read for the authenticated user
export async function PUT(request: NextRequest) {
  const token = await getToken({ req: request });
  if (!token || !token.sub) {
    return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
  }
  const userId = token.sub;

  await dbConnect();

  try {
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: true, message: 'No unread notifications found to mark as read.', modifiedCount: 0 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully marked ${result.modifiedCount} notifications as read.`,
      modifiedCount: result.modifiedCount 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
