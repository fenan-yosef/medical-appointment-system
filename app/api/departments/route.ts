import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Department from "@/models/Department"; // Assuming Department model exists

export async function GET() {
  try {
    await connectToDatabase();
    console.log("Database connected successfully");

    const departments = await Department.find({}).select("name _id description");
    console.log("Fetched departments:", departments);

    return NextResponse.json({ departments }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    console.log("Database connected successfully");

    const body = await request.json();
    const { name, description, contactInfo, location, specialties, isActive } = body;

    // Validate required fields
    if (!name || !description) {
      return NextResponse.json(
        { message: "Missing required fields: name and description are mandatory." },
        { status: 400 }
      );
    }

    // Create a new department
    const newDepartment = new Department({
      name,
      description,
      contactInfo,
      location,
      specialties,
      isActive: isActive ?? true, // Default to true if not provided
    });

    await newDepartment.save();
    console.log("Department created successfully:", newDepartment);

    return NextResponse.json(
      { message: "Department created successfully.", department: newDepartment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
