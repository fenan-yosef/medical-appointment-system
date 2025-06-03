import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// PUT change doctor password
export async function PUT(request: NextRequest) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user || session.user.role !== "doctor") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { currentPassword, newPassword } = body

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 })
        }

        const doctor = await User.findById(session.user.id)

        if (!doctor) {
            return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, doctor.password)

        if (!isCurrentPasswordValid) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12)

        // Update password
        await User.findByIdAndUpdate(session.user.id, { password: hashedNewPassword })

        return NextResponse.json({
            success: true,
            message: "Password updated successfully",
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
