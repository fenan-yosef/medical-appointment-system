import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import dbConnect from "@/lib/db"
import Appointment from "@/models/Appointment"
import { NotificationService } from "@/lib/services/notificationService"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// PUT update appointment status and notes
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user || session.user.role !== "doctor") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { status, doctorNotes, notes } = body

        const appointment = await Appointment.findById(params.id)

        if (!appointment) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        }

        // Ensure the appointment belongs to the logged-in doctor
        if (appointment.doctor.toString() !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Update appointment
        const updateData: any = { updatedAt: new Date() }

        if (status) updateData.status = status
        if (doctorNotes !== undefined) updateData.doctorNotes = doctorNotes
        if (notes !== undefined) updateData.notes = notes

        const updatedAppointment = await Appointment.findByIdAndUpdate(params.id, updateData, { new: true })
            .populate("patient", "firstName lastName email phone")
            .populate("department", "name")

        // Create notification for status changes
        if (status && status !== appointment.status) {
            try {
                let notificationType = "appointment_updated"
                if (status === "completed") notificationType = "appointment_completed"
                if (status === "cancelled") notificationType = "appointment_cancelled"

                await NotificationService.createAppointmentNotification(updatedAppointment, notificationType)
            } catch (notificationError) {
                console.error("Failed to create notification:", notificationError)
            }
        }

        return NextResponse.json({ success: true, data: updatedAppointment })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET specific appointment details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user || session.user.role !== "doctor") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const appointment = await Appointment.findById(params.id)
            .populate("patient", "firstName lastName email phone address dateOfBirth gender")
            .populate("department", "name")

        if (!appointment) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        }

        // Ensure the appointment belongs to the logged-in doctor
        if (appointment.doctor.toString() !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        return NextResponse.json({ success: true, data: appointment })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
