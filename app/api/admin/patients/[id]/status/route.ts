import { type NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";

interface Params {
  id: string;
}

// PUT handler for updating a patient's isActive status (Admin)
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
      return NextResponse.json({ message: "Invalid patient ID format." }, { status: 400 });
    }

    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ message: "isActive field must be a boolean." }, { status: 400 });
    }

    const patient = await User.findById(id);

    if (!patient) {
      return NextResponse.json({ message: "Patient not found." }, { status: 404 });
    }

    if (patient.role !== "patient") {
      return NextResponse.json({ message: "User found but is not a patient." }, { status: 400 });
    }

    patient.isActive = isActive;
    patient.updatedAt = new Date(); // Update the timestamp
    await patient.save();

    // Exclude sensitive fields from the returned object
    const patientToReturn = patient.toObject();
    delete patientToReturn.password;
    delete patientToReturn.resetPasswordToken;
    delete patientToReturn.resetPasswordExpires;
    delete patientToReturn.emailVerificationToken;


    return NextResponse.json(
      { message: `Patient status updated successfully. Patient is now ${isActive ? 'active' : 'inactive'}.`, patient: patientToReturn },
      { status: 200 }
    );

  } catch (error: any) {
    console.error(`Error updating status for patient ${params.id} (admin):`, error);
    if (error.name === "ValidationError") {
      return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
