import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Department from "@/models/Department"; // Assuming Department model exists

export async function GET() {
  try {
    await connectToDatabase();

    const departments = await Department.find({}).select("name _id description"); // Select specific fields

    return NextResponse.json({ departments }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
