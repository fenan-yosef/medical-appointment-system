import { type NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";

// Define an interface for the route context
interface RouteContext {
  params: {
    id: string;
  };
}

// GET handler for fetching a single patient's details by ID (Admin)
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    // @ts-ignore
    if (!token || token.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized: Access restricted to admins." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = context.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: "Invalid patient ID format." }, { status: 400 });
    }

    const patient = await User.findById(id)
      .select("-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken"); // Exclude sensitive fields

    if (!patient) {
      return NextResponse.json({ message: "Patient not found." }, { status: 404 });
    }

    if (patient.role !== "patient") {
      return NextResponse.json({ message: "User found but is not a patient." }, { status: 400 });
    }

    return NextResponse.json({ message: "Patient details fetched successfully.", patient }, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching patient ${context.params.id} (admin):`, error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

// PUT handler for updating a patient's profile (Admin) - More comprehensive update
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    // @ts-ignore
    if (!token || token.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized: Access restricted to admins." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = context.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: "Invalid patient ID format." }, { status: 400 });
    }

    const existingPatient = await User.findById(id);
    if (!existingPatient) {
      return NextResponse.json({ message: "Patient not found." }, { status: 404 });
    }
    if (existingPatient.role !== "patient") {
      return NextResponse.json({ message: "User found but cannot be updated through this endpoint as they are not a patient." }, { status: 400 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address, // { street, city, state, zipCode, country }
      dateOfBirth,
      gender,
      emergencyContact, // { name, relationship, phoneNumber }
      insurance, // { provider, policyNumber, expiryDate }
      isActive,
      // 'password' should not be updatable here (use reset flow)
      // 'role' should not be updatable here
    } = body;

    const updateFields: any = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (email !== undefined) {
      const existingUserWithEmail = await User.findOne({ email: email, _id: { $ne: id } });
      if (existingUserWithEmail) {
        return NextResponse.json({ message: "Email is already in use by another user." }, { status: 409 });
      }
      updateFields.email = email;
    }
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
    if (address !== undefined) updateFields.address = address;
    if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updateFields.gender = gender;
    if (emergencyContact !== undefined) updateFields.emergencyContact = emergencyContact;
    if (insurance !== undefined) updateFields.insurance = insurance;
    if (isActive !== undefined) updateFields.isActive = isActive;

    updateFields.updatedAt = new Date();

    const updatedPatient = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true, context: 'query' }
    )
      .select("-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken");

    if (!updatedPatient) {
      return NextResponse.json({ message: "Patient not found or unable to update." }, { status: 404 });
    }

    return NextResponse.json({ message: "Patient profile updated successfully.", patient: updatedPatient }, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating patient ${context.params.id} (admin):`, error);
    if (error.name === "ValidationError") {
      return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
    }
    if (error.code === 11000) {
      return NextResponse.json({ message: "Duplicate key error. An existing user might already have this email or other unique field.", details: error.keyValue }, { status: 409 });
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
