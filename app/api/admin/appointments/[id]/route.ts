import { type NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User"; // For validation and populating
import Department from "@/models/Department"; // For validation and populating
import { getToken } from "next-auth/jwt";

interface Params {
  id: string;
}

// GET handler for fetching a single appointment by ID
export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    // @ts-ignore
    if (!token || token.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized: Access restricted to admins." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return NextResponse.json({ message: "Invalid appointment ID format." }, { status: 400 });
    }

    const appointment = await Appointment.findById(id)
      .populate({ path: "patient", model: User, select: "firstName lastName email" })
      .populate({ path: "doctor", model: User, select: "firstName lastName email specialization" })
      .populate({ path: "department", model: Department, select: "name" });

    if (!appointment) {
      return NextResponse.json({ message: "Appointment not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Appointment fetched successfully.", appointment }, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching appointment ${params.id} (admin):`, error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

// PUT handler for updating an appointment
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    // @ts-ignore
    if (!token || token.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized: Access restricted to admins." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return NextResponse.json({ message: "Invalid appointment ID format." }, { status: 400 });
    }

    const body = await req.json();
    const { patient, doctor, department, date, time, reason, notes, status } = body;

    // Basic validation for presence of some fields if they are being updated
    // More specific validation (e.g., valid IDs, date formats) should be added as needed

    if (patient) {
        const patientExists = await User.findById(patient);
        if (!patientExists || patientExists.role !== 'patient') {
            return NextResponse.json({ message: "Invalid patient ID or user is not a patient." }, { status: 400 });
        }
    }
    if (doctor) {
        const doctorExists = await User.findById(doctor);
        if (!doctorExists || doctorExists.role !== 'doctor') {
            return NextResponse.json({ message: "Invalid doctor ID or user is not a doctor." }, { status: 400 });
        }
    }
    if (department) {
        const departmentExists = await Department.findById(department);
        if (!departmentExists) {
            return NextResponse.json({ message: "Invalid department ID." }, { status: 400 });
        }
    }
    if (date) {
        const appointmentDate = new Date(date);
        const today = new Date();
        today.setHours(0,0,0,0); 
        // Allow updates to past dates for record keeping, but new appointments shouldn't be in past (handled in POST)
        // if (appointmentDate < today) {
        //     return NextResponse.json({ message: "Appointment date cannot be in the past." }, { status: 400 });
        // }
    }
    if (time && time.start && time.end && time.start >= time.end) {
        return NextResponse.json({ message: "Appointment start time must be before end time." }, { status: 400 });
    }


    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: body }, // Use $set to only update provided fields
      { new: true, runValidators: true } // Return updated doc, run schema validators
    )
    .populate({ path: "patient", model: User, select: "firstName lastName email" })
    .populate({ path: "doctor", model: User, select: "firstName lastName email specialization" })
    .populate({ path: "department", model: Department, select: "name" });

    if (!updatedAppointment) {
      return NextResponse.json({ message: "Appointment not found or unable to update." }, { status: 404 });
    }

    return NextResponse.json({ message: "Appointment updated successfully.", appointment: updatedAppointment }, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating appointment ${params.id} (admin):`, error);
    if (error.name === "ValidationError") {
      return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE handler for deleting an appointment
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    // @ts-ignore
    if (!token || token.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized: Access restricted to admins." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return NextResponse.json({ message: "Invalid appointment ID format." }, { status: 400 });
    }

    // Option 1: Actual Deletion
    // const deletedAppointment = await Appointment.findByIdAndDelete(id);
    // if (!deletedAppointment) {
    //   return NextResponse.json({ message: "Appointment not found or already deleted." }, { status: 404 });
    // }
    // return new NextResponse(null, { status: 204 }); // No Content

    // Option 2: Change status to 'cancelled' (Soft Delete)
    const cancelledAppointment = await Appointment.findByIdAndUpdate(
      id,
      { $set: { status: "cancelled", notes: "Cancelled by admin." } }, // Add a note about cancellation
      { new: true }
    );

    if (!cancelledAppointment) {
      return NextResponse.json({ message: "Appointment not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Appointment cancelled successfully.", appointment: cancelledAppointment }, { status: 200 });

  } catch (error: any) {
    console.error(`Error deleting/cancelling appointment ${params.id} (admin):`, error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
