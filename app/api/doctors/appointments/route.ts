import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import dbConnect from "@/lib/db"
import Appointment from "@/models/Appointment"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET appointments for the logged-in doctor
export async function GET(request: NextRequest) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user || session.user.role !== "doctor") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status")
        const date = searchParams.get("date")
        const page = Number.parseInt(searchParams.get("page") || "1", 10)
        const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
        const sortBy = searchParams.get("sortBy") || "date"
        const sortOrder = searchParams.get("sortOrder") || "asc"

        // Build query
        const query: any = { doctor: session.user.id }

        // Filter by status
        if (status && status !== "all") {
            if (status === "upcoming") {
                query.date = { $gte: new Date() }
                query.status = { $nin: ["cancelled", "completed", "no-show"] }
            } else if (status === "past") {
                query.$or = [{ date: { $lt: new Date() } }, { status: { $in: ["cancelled", "completed", "no-show"] } }]
            } else {
                query.status = status
            }
        }

        // Filter by date
        if (date) {
            const startDate = new Date(date)
            const endDate = new Date(date)
            endDate.setDate(endDate.getDate() + 1)
            query.date = { $gte: startDate, $lt: endDate }
        }

        // Execute query with pagination
        const appointments = await Appointment.find(query)
            .populate("patient", "firstName lastName email phone")
            .populate("department", "name")
            .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit)

        const totalAppointments = await Appointment.countDocuments(query)

        // Get today's appointments count
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todayCount = await Appointment.countDocuments({
            doctor: session.user.id,
            date: { $gte: today, $lt: tomorrow },
            status: { $nin: ["cancelled", "no-show"] },
        })

        // Get upcoming appointments count
        const upcomingCount = await Appointment.countDocuments({
            doctor: session.user.id,
            date: { $gte: new Date() },
            status: { $nin: ["cancelled", "completed", "no-show"] },
        })

        return NextResponse.json({
            success: true,
            data: appointments,
            totalPages: Math.ceil(totalAppointments / limit),
            currentPage: page,
            total: totalAppointments,
            stats: {
                today: todayCount,
                upcoming: upcomingCount,
            },
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
