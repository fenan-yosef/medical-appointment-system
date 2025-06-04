// @ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Department from "@/models/Department"; // To validate and populate department
import { getToken } from "next-auth/jwt";

// Define a more explicit type for the context containing params
interface RouteContext {
  params: Promise<{ // Changed: params is a Promise
    id: string | string[] | undefined; // Changed: id type matches SegmentParams
  }>;
}

// GET handler for fetching a single doctor's profile by ID (Admin)
export async function GET(request: NextRequest, context: RouteContext) {
  // Await the context or params if Next.js expects it to be a Promise
  // Let's try awaiting context.params first as the error points to params's type.
  const resolvedParams = await context.params;
  const idFromParams = resolvedParams.id; // idFromParams is string | string[] | undefined

  // Add type validation for idFromParams
  if (typeof idFromParams !== 'string') {
    return NextResponse.json({ message: "Invalid or missing doctor ID in route parameters." }, { status: 400 });
  }
  const id = idFromParams; // id is now confirmed to be a string

  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    // @ts-ignore
    // if (!token || token.role !== "admin") {
    //   return NextResponse.json({ message: "Unauthorized: Access restricted to admins." }, { status: 403 });
    // }

    await connectToDatabase();

    if (!id.match(/^[0-9a-fA-F]{24}$/)) { // This check can now safely use id as string
      return NextResponse.json({ message: "Invalid doctor ID format." }, { status: 400 });
    }

    const doctor = await User.findById(id)
      .select("-password") // Exclude password
      .populate({ path: "department", model: Department, select: "name" });

    if (!doctor) {
      return NextResponse.json({ message: "Doctor not found." }, { status: 404 });
    }

    if (doctor.role !== "doctor") {
      return NextResponse.json({ message: "User found but is not a doctor." }, { status: 400 });
    }

    return NextResponse.json({ message: "Doctor profile fetched successfully.", doctor }, { status: 200 });
  } catch (error: any) {
    console.error(`Error fetching doctor ${id} (admin):`, error); // Use the resolved id
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

// PUT handler for updating a doctor's profile (Admin)
export async function PUT(request: NextRequest, context: RouteContext) {
  // Await the context or params
  const resolvedParams = await context.params;
  const idFromParams = resolvedParams.id; // idFromParams is string | string[] | undefined

  // Add type validation for idFromParams
  if (typeof idFromParams !== 'string') {
    return NextResponse.json({ message: "Invalid or missing doctor ID in route parameters." }, { status: 400 });
  }
  const id = idFromParams; // id is now confirmed to be a string

  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    // @ts-ignore
    // if (!token || token.role !== "admin") {
    //   return NextResponse.json({ message: "Unauthorized: Access restricted to admins." }, { status: 403 });
    // }

    await connectToDatabase();
    // const resolvedParams = await params; // This line was from a previous iteration, ensure it's correct based on context.

    if (!id.match(/^[0-9a-fA-F]{24}$/)) { // This check can now safely use id as string
      return NextResponse.json({ message: "Invalid doctor ID format." }, { status: 400 });
    }

    const existingDoctor = await User.findById(id);
    if (!existingDoctor) {
      return NextResponse.json({ message: "Doctor not found." }, { status: 404 });
    }
    if (existingDoctor.role !== "doctor") {
      return NextResponse.json({ message: "User found but cannot be updated through this endpoint as they are not a doctor." }, { status: 400 });
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
      profileImage,
      specialization,
      schedule,
      licenseNumber,
      department, // Department ID
      isActive,
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
    if (dateOfBirth !== undefined) updateFields.dateOfBirth = new Date(dateOfBirth);
    if (gender !== undefined) updateFields.gender = gender;
    if (profileImage !== undefined) updateFields.profileImage = profileImage;
    if (specialization !== undefined) updateFields.specialization = specialization;
    if (schedule !== undefined) updateFields.schedule = schedule;
    if (licenseNumber !== undefined) updateFields.licenseNumber = licenseNumber;
    if (isActive !== undefined) updateFields.isActive = isActive;

    if (department !== undefined) {
      if (department === null || department === "") {
        updateFields.department = null;
      } else if (!department.match(/^[0-9a-fA-F]{24}$/)) {
        return NextResponse.json({ message: "Invalid department ID format." }, { status: 400 });
      } else {
        const departmentExists = await Department.findById(department);
        if (!departmentExists) {
          return NextResponse.json({ message: "Department not found." }, { status: 400 });
        }
        updateFields.department = department;
      }
    }

    updateFields.updatedAt = new Date();

    const updatedDoctor = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true, context: 'query' }
    )
      .select("-password")
      .populate({ path: "department", model: Department, select: "name" });

    if (!updatedDoctor) {
      return NextResponse.json({ message: "Doctor not found or unable to update." }, { status: 404 });
    }

    return NextResponse.json({ message: "Doctor profile updated successfully.", doctor: updatedDoctor }, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating doctor ${id} (admin):`, error); // Use the resolved id
    if (error.name === "ValidationError") {
      return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
    }
    if (error.code === 11000) { // Mongoose duplicate key error (e.g. email)
      return NextResponse.json({ message: "Duplicate key error. An existing user might already have this email or other unique field.", details: error.keyValue }, { status: 409 });
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
