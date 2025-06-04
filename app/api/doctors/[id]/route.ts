import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

// GET a single doctor by ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Doctor ID is required." },
                { status: 400 }
            );
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, error: "Invalid Doctor ID format." },
                { status: 400 }
            );
        }

        const doctor = await User.findById(id)
            .select("firstName lastName email specialization department schedule role isActive") // Select 'schedule' field
            .populate("department", "name") // Populate department to get its name
            .lean() as (Record<string, any> | null); // Explicitly type as object or null

        if (!doctor || doctor.role !== "doctor" || !doctor.isActive) {
            return NextResponse.json(
                { success: false, error: "Doctor not found or not active." },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: doctor });
    } catch (error: any) {
        console.error("Error fetching doctor:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}