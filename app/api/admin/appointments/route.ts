import { type NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Appointment from "@/models/Appointment";
import User from "@/models/User"; // For populating doctor/patient
import Department from "@/models/Department"; // For populating department
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    // @ts-ignore
    // if (!token || token.role !== "admin") {
    //   return NextResponse.json({ message: "Unauthorized: Access restricted to admins." }, { status: 403 });
    // }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);

    // Filtering
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "date"; // Default sort by date
    const order = searchParams.get("order") === "desc" ? -1 : 1; // Default order ascending

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const query: any = {};

    if (dateFrom) {
      query.date = { ...query.date, $gte: new Date(dateFrom) };
    }
    if (dateTo) {
      query.date = { ...query.date, $lte: new Date(dateTo) };
    }
    if (doctorId) query.doctor = doctorId;
    if (patientId) query.patient = patientId;
    if (departmentId) query.department = departmentId;
    if (status) query.status = status;

    const sortOptions: { [key: string]: any } = {};
    if (sortBy) sortOptions[sortBy] = order;

    const appointments = await Appointment.find(query)
      .populate({ path: "patient", model: User, select: "firstName lastName email" })
      .populate({ path: "doctor", model: User, select: "firstName lastName email specialization" })
      .populate({ path: "department", model: Department, select: "name" })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean for performance if not modifying docs

    const totalAppointments = await Appointment.countDocuments(query);
    const totalPages = Math.ceil(totalAppointments / limit);

    return NextResponse.json(
      {
        message: "Appointments fetched successfully.",
        appointments,
        currentPage: page,
        totalPages,
        totalAppointments,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching appointments (admin):", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
