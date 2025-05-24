import { type NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User"; // Assuming User model exists
import Department from "@/models/Department"; // To validate departmentId if needed

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");

    const query: any = { role: "doctor" };

    if (departmentId) {
      // Optional: Validate if departmentId is a valid ObjectId or if department exists
      // For now, we assume departmentId is a valid ObjectId string referring to a department
      // and doctors might have a department field (string or ObjectId)
      // If User model stores department as ObjectId:
      // query.department = departmentId; 
      // If User model stores department name and we need to find department ObjectId first:
      // This would require an additional query or a different schema structure.
      // For this implementation, I'll assume doctors have a field `department` that is an ObjectId.
      // The User model needs to be updated to include a department field for doctors.
      // Let's assume the User model has a 'department' field which is an ObjectId referencing the Department collection.
      query.department = departmentId;
    }

    // Select specific fields. Ensure these fields exist in your User model.
    // 'specialization' and 'department' might need to be added to the User model for doctors.
    const doctors = await User.find(query)
      .select("_id firstName lastName email specialization department") // Adjust fields as per your User model
      .populate("department", "name"); // Optionally populate department name

    if (doctors.length === 0 && departmentId) {
      return NextResponse.json(
        { message: "No doctors found for this department or department is invalid." },
        { status: 404 }
      );
    }
    
    if (doctors.length === 0) {
        return NextResponse.json(
          { message: "No doctors found." },
          { status: 404 }
        );
      }

    return NextResponse.json({ doctors }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
