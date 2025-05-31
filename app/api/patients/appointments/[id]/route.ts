import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import dbConnect from "@/lib/db"
import Appointment from "@/models/Appointment"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET a specific appointment
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const appointment = await Appointment.findById(params.id)
            .populate("doctor", "firstName lastName email")
            .populate("department", "name")

        if (!appointment) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        }

        // Ensure the appointment belongs to the logged-in patient
        if (appointment.patient.toString() !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        return NextResponse.json({ success: true, data: appointment })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT update an appointment
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const appointment = await Appointment.findById(params.id)

        if (!appointment) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        }

        // Ensure the appointment belongs to the logged-in patient
        if (appointment.patient.toString() !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Only allow updating certain fields
        const allowedUpdates = ["reason", "notes", "attachments"]
        Object.keys(body).forEach((key) => {
            if (allowedUpdates.includes(key)) {
                appointment[key] = body[key]
            }
        })

        appointment.updatedAt = new Date()
        await appointment.save()

        return NextResponse.json({ success: true, data: appointment })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE cancel an appointment
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const appointment = await Appointment.findById(params.id)

        if (!appointment) {
            return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
        }

        // Ensure the appointment belongs to the logged-in patient
        if (appointment.patient.toString() !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Don't actually delete, just mark as cancelled
        appointment.status = "cancelled"
        appointment.updatedAt = new Date()
        await appointment.save()

        return NextResponse.json({ success: true, data: appointment })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
