import { type NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User"; // Assuming User model is used for patients as well
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
    const email = searchParams.get("email");
    const isActive = searchParams.get("isActive"); // 'true' or 'false'

    // Sorting
    const sortBy = searchParams.get("sortBy") || "lastName"; // Default sort by lastName
    const order = searchParams.get("order") === "desc" ? -1 : 1; // Default order ascending

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const query: any = { role: "patient" };

    if (name) {
      query.$or = [
        { firstName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ];
    }
    if (email) {
      query.email = { $regex: email, $options: "i" };
    }
    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }
    
    const sortOptions: { [key: string]: any } = {};
    if (sortBy) sortOptions[sortBy] = order;

    const patients = await User.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerified") // Exclude sensitive fields
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPatients = await User.countDocuments(query);
    const totalPages = Math.ceil(totalPatients / limit);

    return NextResponse.json(
      {
        message: "Patients fetched successfully.",
        patients,
        currentPage: page,
        totalPages,
        totalPatients,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching patients (admin):", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
