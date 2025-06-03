import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import dbConnect from "@/lib/db"
import Appointment from "@/models/Appointment"
import { NotificationService } from "@/lib/services/notificationService"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET all appointments for the logged-in patient
export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // upcoming, past, all
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    // Build query
    const query: any = { patient: session.user.id }

    // Filter by status
    if (status === "upcoming") {
      query.date = { $gte: new Date() }
      query.status = { $nin: ["cancelled", "completed"] }
    } else if (status === "past") {
      query.$or = [{ date: { $lt: new Date() } }, { status: { $in: ["cancelled", "completed"] } }]
    }

    // Execute query with pagination
    const appointments = await Appointment.find(query)
      .populate("doctor", "firstName lastName email")
      .populate("department", "name")
      .sort({ date: 1, "time.start": 1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const totalAppointments = await Appointment.countDocuments(query)

    return NextResponse.json({
      success: true,
      data: appointments,
      totalPages: Math.ceil(totalAppointments / limit),
      currentPage: page,
      total: totalAppointments,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create a new appointment
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { doctor, department, date, time, reason, type } = body

    // Validate required fields
    if (!doctor || !department || !date || !time || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create appointment
    const appointment = new Appointment({
      patient: session.user.id,
      doctor,
      department,
      date,
      time,
      reason,
      type: type || "initial",
      createdBy: session.user.id,
      status: "scheduled",
    })



    await appointment.save()

    try {
      await NotificationService.createAppointmentNotification(
        {
          ...appointment.toObject(),
          patient: session.user.id,
        },
        "appointment_created",
      )
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError)
      // Don't fail the appointment creation if notification fails
    }

    return NextResponse.json({ success: true, data: appointment }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
