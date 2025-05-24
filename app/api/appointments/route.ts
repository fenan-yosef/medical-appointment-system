import { type NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User"; // For validation
import Department from "@/models/Department"; // For validation
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.sub) {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }
    const createdBy = token.sub; // User ID from session

    const { patient, doctor, department, date, time, reason, notes } = await req.json();

    // Validate required fields
    if (!patient || !doctor || !department || !date || !time || !time.start || !time.end || !reason) {
      return NextResponse.json(
        { message: "Missing required fields: patient, doctor, department, date, time (with start/end), reason are mandatory." },
        { status: 400 }
      );
    }

    // Optional: Validate existence of patient, doctor, department
    const patientExists = await User.findById(patient);
    if (!patientExists || patientExists.role !== 'patient') {
        return NextResponse.json({ message: "Invalid patient ID or user is not a patient." }, { status: 400 });
    }

    const doctorExists = await User.findById(doctor);
    if (!doctorExists || doctorExists.role !== 'doctor') {
        return NextResponse.json({ message: "Invalid doctor ID or user is not a doctor." }, { status: 400 });
    }
    
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
        return NextResponse.json({ message: "Invalid department ID." }, { status: 400 });
    }

    // Validate date and time logic (e.g., date is not in the past, end time is after start time)
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0,0,0,0); // Compare dates only

    if (appointmentDate < today) {
        return NextResponse.json({ message: "Appointment date cannot be in the past." }, { status: 400 });
    }
    
    // Basic time validation (e.g. "10:00" < "11:00")
    if (time.start >= time.end) {
        return NextResponse.json({ message: "Appointment start time must be before end time." }, { status: 400 });
    }


    const newAppointment = new Appointment({
      patient,
      doctor,
      department,
      date: appointmentDate,
      time, // { start: "HH:MM", end: "HH:MM" }
      reason,
      notes, // Optional
      status: "scheduled", // Default status
      createdBy, 
    });

    await newAppointment.save();

    return NextResponse.json(
      { message: "Appointment created successfully", appointment: newAppointment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    // Check for specific mongoose validation errors if needed
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Validation Error", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
