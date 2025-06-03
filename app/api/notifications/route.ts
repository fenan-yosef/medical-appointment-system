import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { NotificationService } from "@/lib/services/notificationService"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10)

    const notifications = await NotificationService.getUserNotifications(session.user.id, page, limit)

    return NextResponse.json({
      success: true,
      data: notifications,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
