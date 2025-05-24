import { type NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Department from "@/models/Department"; // To validate and populate department
import { getToken } from "next-auth/jwt";

interface Params {
  id: string;
}

// GET handler for fetching a single doctor's profile by ID (Admin)
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
    console.error(`Error fetching doctor ${params.id} (admin):`, error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

// PUT handler for updating a doctor's profile (Admin)
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
      return NextResponse.json({ message: "Invalid doctor ID format." }, { status: 400 });
    }

    const existingDoctor = await User.findById(id);
    if (!existingDoctor) {
      return NextResponse.json({ message: "Doctor not found." }, { status: 404 });
    }
    if (existingDoctor.role !== "doctor") {
      return NextResponse.json({ message: "User found but cannot be updated through this endpoint as they are not a doctor." }, { status: 400 });
    }

    const body = await req.json();
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
      licenseNumber,
      department, // Department ID
      isActive,
      // Note: 'password' should not be updatable here
      // 'role' should not be updatable here to prevent role escalation/change via this specific route
    } = body;

    // Fields to update
    const updateFields: any = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (email !== undefined) {
        // Add email validation if necessary, e.g., check format or if it's already taken by another user
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
    if (licenseNumber !== undefined) updateFields.licenseNumber = licenseNumber;
    if (isActive !== undefined) updateFields.isActive = isActive;

    if (department !== undefined) {
      if (department === null || department === "") { // Allow unsetting department
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
    
    // Update timestamp
    updateFields.updatedAt = new Date();

    const updatedDoctor = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true, context: 'query' } // Return updated doc, run schema validators
    )
    .select("-password") // Exclude password from response
    .populate({ path: "department", model: Department, select: "name" });

    if (!updatedDoctor) {
      return NextResponse.json({ message: "Doctor not found or unable to update." }, { status: 404 });
    }

    return NextResponse.json({ message: "Doctor profile updated successfully.", doctor: updatedDoctor }, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating doctor ${params.id} (admin):`, error);
    if (error.name === "ValidationError") {
      return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
    }
    if (error.code === 11000) { // Mongoose duplicate key error (e.g. email)
        return NextResponse.json({ message: "Duplicate key error. An existing user might already have this email or other unique field.", details: error.keyValue }, { status: 409 });
    }
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
