import { type NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Department from "@/models/Department"; // For populating department
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    // @ts-ignore
    if (!token || token.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized: Access restricted to admins." }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);

    // Filtering
    const name = searchParams.get("name"); // Search by first or last name
    const specialization = searchParams.get("specialization");
    const departmentId = searchParams.get("departmentId");
    const isActive = searchParams.get("isActive"); // 'true' or 'false'

    // Sorting
    const sortBy = searchParams.get("sortBy") || "lastName"; // Default sort by lastName
    const order = searchParams.get("order") === "desc" ? -1 : 1; // Default order ascending

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const query: any = { role: "doctor" };

    if (name) {
      query.$or = [
        { firstName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ];
    }
    if (specialization) {
      query.specialization = { $regex: specialization, $options: "i" };
    }
    if (departmentId) {
      query.department = departmentId;
    }
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const sortOptions: { [key: string]: any } = {};
    if (sortBy) sortOptions[sortBy] = order;

    const doctors = await User.find(query)
      .select("-password") // Exclude password
      .populate({ path: "department", model: Department, select: "name _id" })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalDoctors = await User.countDocuments(query);
    const totalPages = Math.ceil(totalDoctors / limit);

    return NextResponse.json(
      {
        message: "Doctors fetched successfully.",
        doctors,
        currentPage: page,
        totalPages,
        totalDoctors,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching doctors (admin):", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST handler for creating a new doctor (Admin)
export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    // @ts-ignore
    // if (!token || token.role !== "admin") {
    //   return NextResponse.json({ message: "Unauthorized: Access restricted to admins." }, { status: 403 });
    // }

    await connectToDatabase();

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      specialization,
      licenseNumber,
      department, // Department ID
      phoneNumber,
      address,
      dateOfBirth,
      gender,
      profileImage,
      isActive = true, // Default to true
    } = body;

    console.log("Creating doctor with body:", body);

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !specialization || !department) {
      return NextResponse.json({
        message: "Missing required fields: firstName, lastName, email, password, specialization, and department are mandatory."
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long." }, { status: 400 });
    }

    // Validate email format (basic)
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ message: "Invalid email format." }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists." }, { status: 409 }); // 409 Conflict
    }

    // Validate department
    if (!department.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: "Invalid department ID format." }, { status: 400 });
    }
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return NextResponse.json({ message: "Department not found." }, { status: 400 });
    }

    // Create new doctor
    const newDoctor = new User({
      firstName,
      lastName,
      email,
      password, // Will be hashed by the pre-save hook in User model
      role: 'doctor', // Explicitly set role
      specialization,
      licenseNumber,
      department,
      phoneNumber,
      address,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      profileImage,
      isActive,
      emailVerified: new Date(), // Consider new doctors created by admin as email verified
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newDoctor.save();

    // Exclude password from response
    const doctorToReturn = newDoctor.toObject();
    delete doctorToReturn.password;

    return NextResponse.json(
      { message: "Doctor account created successfully.", doctor: doctorToReturn },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error creating doctor (admin):", error);
    if (error.name === "ValidationError") {
      return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { message: error.message || "Internal server error while creating doctor." },
      { status: 500 }
    );
  }
}
