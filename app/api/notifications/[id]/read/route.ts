import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { NotificationService } from "@/lib/services/notificationService"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// PUT mark notification as read
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const notification = await NotificationService.markAsRead(params.id, session.user.id)

        return NextResponse.json({
            success: true,
            data: notification,
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
