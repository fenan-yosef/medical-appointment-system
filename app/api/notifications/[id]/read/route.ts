import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { NotificationService } from "@/lib/services/notificationService"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"; // Import mongoose for ObjectId validation

// Define the expected shape of the resolved params
interface ResolvedParams {
    id: string | string[] | undefined;
}

// Define the context type for route handlers
interface RouteContext {
    params: Promise<ResolvedParams>;
}

// PUT mark notification as read
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const resolvedParams = await context.params;
        const idFromParams = resolvedParams.id;

        if (typeof idFromParams !== 'string' || !mongoose.Types.ObjectId.isValid(idFromParams)) {
            return NextResponse.json({ error: "Invalid or missing Notification ID format" }, { status: 400 });
        }
        const id = idFromParams; // id is now a validated string

        const notification = await NotificationService.markAsRead(id, session.user.id)

        return NextResponse.json({
            success: true,
            data: notification,
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
