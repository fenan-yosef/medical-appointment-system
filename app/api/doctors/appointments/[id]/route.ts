import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import dbConnect from "@/lib/db"
import Appointment from "@/models/Appointment"
import { NotificationService } from "@/lib/services/notificationService"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"; // Import mongoose

// Define the expected shape of the resolved params
interface ResolvedParams {
    id: string | string[] | undefined;
}

// Define the context type for route handlers
interface RouteContext {
    params: Promise<ResolvedParams>;
}

// PUT update appointment status and notes
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user || session.user.role !== "doctor") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const resolvedParams = await context.params;
        const idFromParams = resolvedParams.id;

        if (typeof idFromParams !== 'string' || !mongoose.Types.ObjectId.isValid(idFromParams)) {
            return NextResponse.json({ error: "Invalid or missing Appointment ID format" }, { status: 400 });
        }
        const id = idFromParams; // id is now a validated string

        const body = await request.json()
        const { status, doctorNotes, notes } = body

        const appointment = await Appointment.findById(id)

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

        const updatedAppointment = await Appointment.findByIdAndUpdate(id, updateData, { new: true })
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
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user || session.user.role !== "doctor") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const resolvedParams = await context.params;
        const idFromParams = resolvedParams.id;

        if (typeof idFromParams !== 'string' || !mongoose.Types.ObjectId.isValid(idFromParams)) {
            return NextResponse.json({ error: "Invalid or missing Appointment ID format" }, { status: 400 });
        }
        const id = idFromParams; // id is now a validated string

        const appointment = await Appointment.findById(id)
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
