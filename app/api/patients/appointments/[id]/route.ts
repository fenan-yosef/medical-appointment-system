import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import dbConnect from "@/lib/db"
import Appointment from "@/models/Appointment"
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

// GET a specific appointment
export async function GET(request: NextRequest, context: RouteContext) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const resolvedParams = await context.params;
        const idFromParams = resolvedParams.id;

        if (typeof idFromParams !== 'string' || !mongoose.Types.ObjectId.isValid(idFromParams)) {
            return NextResponse.json({ error: "Invalid or missing Appointment ID format" }, { status: 400 });
        }
        const id = idFromParams; // id is now a validated string

        const appointment = await Appointment.findById(id)
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
export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const resolvedParams = await context.params;
        const idFromParams = resolvedParams.id;

        if (typeof idFromParams !== 'string' || !mongoose.Types.ObjectId.isValid(idFromParams)) {
            return NextResponse.json({ error: "Invalid or missing Appointment ID format" }, { status: 400 });
        }
        const id = idFromParams; // id is now a validated string

        const body = await request.json()
        const appointment = await Appointment.findById(id)

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
export async function DELETE(request: NextRequest, context: RouteContext) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const resolvedParams = await context.params;
        const idFromParams = resolvedParams.id;

        if (typeof idFromParams !== 'string' || !mongoose.Types.ObjectId.isValid(idFromParams)) {
            return NextResponse.json({ error: "Invalid or missing Appointment ID format" }, { status: 400 });
        }
        const id = idFromParams; // id is now a validated string

        const appointment = await Appointment.findById(id)

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
