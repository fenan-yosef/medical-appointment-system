import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import Appointment from "@/models/Appointment"
import { authOptions } from "@/lib/auth"

// GET detailed analytics
export async function GET(request: NextRequest) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const period = searchParams.get("period") || "week" // week, month, quarter, year
        const metric = searchParams.get("metric") || "appointments"

        const startDate = new Date()
        let groupFormat = "%Y-%m-%d"

        switch (period) {
            case "week":
                startDate.setDate(startDate.getDate() - 7)
                groupFormat = "%Y-%m-%d"
                break
            case "month":
                startDate.setMonth(startDate.getMonth() - 1)
                groupFormat = "%Y-%m-%d"
                break
            case "quarter":
                startDate.setMonth(startDate.getMonth() - 3)
                groupFormat = "%Y-%m"
                break
            case "year":
                startDate.setFullYear(startDate.getFullYear() - 1)
                groupFormat = "%Y-%m"
                break
        }

        let analyticsData = []

        switch (metric) {
            case "appointments":
                analyticsData = await Appointment.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: groupFormat,
                                    date: "$createdAt",
                                },
                            },
                            total: { $sum: 1 },
                            completed: {
                                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                            },
                            cancelled: {
                                $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
                            },
                            scheduled: {
                                $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] },
                            },
                        },
                    },
                    {
                        $sort: { _id: 1 },
                    },
                ])
                break

            case "users":
                analyticsData = await User.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: groupFormat,
                                    date: "$createdAt",
                                },
                            },
                            total: { $sum: 1 },
                            doctors: {
                                $sum: { $cond: [{ $eq: ["$role", "doctor"] }, 1, 0] },
                            },
                            patients: {
                                $sum: { $cond: [{ $eq: ["$role", "patient"] }, 1, 0] },
                            },
                            admins: {
                                $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] },
                            },
                        },
                    },
                    {
                        $sort: { _id: 1 },
                    },
                ])
                break

            case "revenue":
                // This would require a billing/payment model, for now we'll simulate
                analyticsData = await Appointment.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: startDate },
                            status: "completed",
                        },
                    },
                    {
                        $group: {
                            _id: {
                                $dateToString: {
                                    format: groupFormat,
                                    date: "$createdAt",
                                },
                            },
                            appointments: { $sum: 1 },
                            // Simulated revenue calculation
                            revenue: { $sum: 100 }, // Assuming $100 per appointment
                        },
                    },
                    {
                        $sort: { _id: 1 },
                    },
                ])
                break
        }

        return NextResponse.json({
            success: true,
            data: {
                period,
                metric,
                analytics: analyticsData,
            },
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
