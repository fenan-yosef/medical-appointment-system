import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import Appointment from "@/models/Appointment"
import Service from "@/models/Service"
import Department from "@/models/Department"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// GET dashboard statistics
export async function GET(request: NextRequest) {
    try {
        await dbConnect()
        const session = await getServerSession(authOptions)

        if (!session || !session.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const timeRange = searchParams.get("timeRange") || "30" // days
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - Number.parseInt(timeRange))

        // Basic counts
        const [
            totalUsers,
            totalDoctors,
            totalPatients,
            totalAppointments,
            totalServices,
            totalDepartments,
            activeUsers,
            recentAppointments,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "doctor" }),
            User.countDocuments({ role: "patient" }),
            Appointment.countDocuments(),
            Service.countDocuments({ isActive: true }),
            Department.countDocuments({ isActive: true }),
            User.countDocuments({ isActive: true }),
            Appointment.countDocuments({ createdAt: { $gte: startDate } }),
        ])

        // User role distribution
        const userRoleDistribution = await User.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 },
                },
            },
        ])

        // Appointment status distribution
        const appointmentStatusDistribution = await Appointment.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ])

        // Appointments by department
        const appointmentsByDepartment = await Appointment.aggregate([
            {
                $lookup: {
                    from: "departments",
                    localField: "department",
                    foreignField: "_id",
                    as: "departmentInfo",
                },
            },
            {
                $unwind: "$departmentInfo",
            },
            {
                $group: {
                    _id: "$departmentInfo.name",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
            {
                $limit: 10,
            },
        ])

        // Daily appointments for the last 30 days
        const dailyAppointments = await Appointment.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                        },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ])

        // Monthly user registrations for the last 12 months
        const yearAgo = new Date()
        yearAgo.setFullYear(yearAgo.getFullYear() - 1)

        const monthlyRegistrations = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: yearAgo },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ])

        // Top doctors by appointment count
        const topDoctors = await Appointment.aggregate([
            {
                $group: {
                    _id: "$doctor",
                    appointmentCount: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "doctorInfo",
                },
            },
            {
                $unwind: "$doctorInfo",
            },
            {
                $project: {
                    name: {
                        $concat: ["$doctorInfo.firstName", " ", "$doctorInfo.lastName"],
                    },
                    specialization: "$doctorInfo.specialization",
                    appointmentCount: 1,
                },
            },
            {
                $sort: { appointmentCount: -1 },
            },
            {
                $limit: 5,
            },
        ])

        // Calculate metrics
        const completedAppointments = await Appointment.countDocuments({ status: "completed" })
        const cancelledAppointments = await Appointment.countDocuments({ status: "cancelled" })
        const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0
        const cancellationRate = totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0

        // Average appointments per day
        const avgAppointmentsPerDay =
            dailyAppointments.length > 0
                ? dailyAppointments.reduce((sum, day) => sum + day.count, 0) / dailyAppointments.length
                : 0

        // Recent activity (last 7 days)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        const recentActivity = {
            newUsers: await User.countDocuments({ createdAt: { $gte: weekAgo } }),
            newAppointments: await Appointment.countDocuments({ createdAt: { $gte: weekAgo } }),
            completedAppointments: await Appointment.countDocuments({
                status: "completed",
                updatedAt: { $gte: weekAgo },
            }),
        }

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalDoctors,
                    totalPatients,
                    totalAppointments,
                    totalServices,
                    totalDepartments,
                    activeUsers,
                    recentAppointments,
                },
                metrics: {
                    completionRate: Math.round(completionRate * 100) / 100,
                    cancellationRate: Math.round(cancellationRate * 100) / 100,
                    avgAppointmentsPerDay: Math.round(avgAppointmentsPerDay * 100) / 100,
                },
                distributions: {
                    userRoles: userRoleDistribution,
                    appointmentStatus: appointmentStatusDistribution,
                    appointmentsByDepartment,
                },
                trends: {
                    dailyAppointments,
                    monthlyRegistrations,
                },
                topPerformers: {
                    doctors: topDoctors,
                },
                recentActivity,
            },
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
