import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import DoctorAvailability from "@/models/DoctorAvailability"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET doctor profile
export async function GET(request: NextRequest) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user || session.user.role !== "doctor") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const doctor = await User.findById(session.user.id).populate("department", "name").select("-password")

        if (!doctor) {
            return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
        }

        // Get doctor's availability
        const availability = await DoctorAvailability.find({ doctor: session.user.id }).sort({ dayOfWeek: 1 })

        return NextResponse.json({
            success: true,
            data: {
                ...doctor.toObject(),
                availability,
            },
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT update doctor profile
export async function PUT(request: NextRequest) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user || session.user.role !== "doctor") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { availability, ...profileData } = body

        // Remove sensitive fields that shouldn't be updated via this endpoint
        const { password, role, isActive, ...updateData } = profileData

        // Update doctor profile
        const updatedDoctor = await User.findByIdAndUpdate(session.user.id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate("department", "name")
            .select("-password")

        if (!updatedDoctor) {
            return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
        }

        // Update availability if provided
        if (availability && Array.isArray(availability)) {
            // Delete existing availability
            await DoctorAvailability.deleteMany({ doctor: session.user.id })

            // Create new availability records
            const availabilityRecords = availability.map((avail: any) => ({
                doctor: session.user.id,
                ...avail,
            }))

            await DoctorAvailability.insertMany(availabilityRecords)
        }

        // Get updated availability
        const updatedAvailability = await DoctorAvailability.find({ doctor: session.user.id }).sort({ dayOfWeek: 1 })

        return NextResponse.json({
            success: true,
            data: {
                ...updatedDoctor.toObject(),
                availability: updatedAvailability,
            },
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
