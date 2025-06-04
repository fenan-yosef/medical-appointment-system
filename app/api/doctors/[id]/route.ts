import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

// Define the expected shape of the resolved params
interface ResolvedParams {
    id: string | string[] | undefined;
}

// Define the context type for route handlers
interface RouteContext {
    params: Promise<ResolvedParams>;
}

// GET a single doctor by ID
export async function GET(
    request: NextRequest,
    context: RouteContext // Changed to use RouteContext
) {
    try {
        await dbConnect();
        const resolvedParams = await context.params; // Await the params
        const idFromParams = resolvedParams.id;

        if (typeof idFromParams !== 'string') { // Type guard for id
            return NextResponse.json(
                { success: false, error: "Doctor ID must be a string." },
                { status: 400 }
            );
        }
        const id = idFromParams; // id is now confirmed to be a string

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