import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import dbConnect from "@/lib/db"
import Appointment from "@/models/Appointment"
import { NotificationService } from "@/lib/services/notificationService"
import { authOptions } from "@/lib/auth"

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
    // Destructure all fields you expect from the frontend, including new ones
    const {
      doctor,
      department,
      date,
      time, // { start: string, end: string }
      reason,
      type, // "initial", "follow-up", etc.
      notes,
      symptoms, // [String]
      diagnosis, // [String]
      prescription, // Array of objects
      attachments, // Array of objects
      followUpRequired, // Boolean
      followUpDate, // Date string
      insuranceDetails, // Object
      billingStatus, // String enum
      paymentDetails, // Object
      reminders, // Array of objects
      // createdBy will be set from session
      // status will be defaulted
    } = body

    // Validate required fields (adjust based on your schema's 'required: true' fields)
    // The original schema you provided had 'reason' as required.
    // 'patient', 'doctor', 'department', 'date', 'time' are also essential.
    if (!doctor || !department || !date || !time || !time.start || !time.end || !reason) {
      return NextResponse.json({ error: "Missing required fields (doctor, department, date, time, reason)" }, { status: 400 })
    }

    // Create appointment with all fields
    const appointmentData: any = {
      patient: session.user.id,
      doctor,
      department,
      date: new Date(date), // Ensure date is stored as a Date object
      time,
      reason,
      type: type || "initial", // Default if not provided
      status: "scheduled", // Default status
      createdBy: session.user.id,
    };

    // Add optional fields if they are provided in the request body
    if (notes !== undefined) appointmentData.notes = notes;
    if (symptoms !== undefined) appointmentData.symptoms = symptoms;
    if (diagnosis !== undefined) appointmentData.diagnosis = diagnosis;
    if (prescription !== undefined) appointmentData.prescription = prescription;
    if (attachments !== undefined) appointmentData.attachments = attachments;
    if (followUpRequired !== undefined) appointmentData.followUpRequired = followUpRequired;
    if (followUpDate !== undefined) appointmentData.followUpDate = new Date(followUpDate);
    if (insuranceDetails !== undefined) appointmentData.insuranceDetails = insuranceDetails;
    if (billingStatus !== undefined) appointmentData.billingStatus = billingStatus;
    if (paymentDetails !== undefined) appointmentData.paymentDetails = paymentDetails;
    if (reminders !== undefined) appointmentData.reminders = reminders;

    const appointment = new Appointment(appointmentData);

    await appointment.save()

    try {
      await NotificationService.createAppointmentNotification(
        {
          ...appointment.toObject(), // Send the full appointment object
          patient: session.user.id, // Ensure patient ID is correctly passed if needed by service
        },
        "appointment_created",
      )
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError)
      // Don't fail the appointment creation if notification fails
    }

    return NextResponse.json({ success: true, data: appointment }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating appointment:", error); // Log the full error
    // Check for Mongoose validation errors specifically
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
