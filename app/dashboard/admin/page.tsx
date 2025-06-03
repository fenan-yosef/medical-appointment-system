"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/StatCard"
import { FilterPanel } from "@/components/dashboard/FilterPanel"
import { CustomPieChart } from "@/components/charts/PieChart"
import { CustomBarChart } from "@/components/charts/BarChart"
import { CustomLineChart } from "@/components/charts/LineChart"
import { CustomAreaChart } from "@/components/charts/AreaChart"
import { useToast } from "@/hooks/use-toast"
import { RealTimeNotifications } from "@/components/RealTimeNotifications"
import {
    Users,
    Calendar,
    UserCheck,
    Activity,
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    Clock,
    CheckCircle,
} from "lucide-react"

interface DashboardStats {
    overview: {
        totalUsers: number
        totalDoctors: number
        totalPatients: number
        totalAppointments: number
        totalServices: number
        totalDepartments: number
        activeUsers: number
        recentAppointments: number
    }
    metrics: {
        completionRate: number
        cancellationRate: number
        avgAppointmentsPerDay: number
    }
    distributions: {
        userRoles: Array<{ _id: string; count: number }>
        appointmentStatus: Array<{ _id: string; count: number }>
        appointmentsByDepartment: Array<{ _id: string; count: number }>
    }
    trends: {
        dailyAppointments: Array<{ _id: string; count: number }>
        monthlyRegistrations: Array<{ _id: { year: number; month: number }; count: number }>
    }
    topPerformers: {
        doctors: Array<{ name: string; specialization: string; appointmentCount: number }>
    }
    recentActivity: {
        newUsers: number
        newAppointments: number
        completedAppointments: number
    }
}

export default function AdminAnalyticsPage() {
    const { data: session } = useSession()
    const { toast } = useToast()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState("30")
    const [period, setPeriod] = useState("week")
    const [metric, setMetric] = useState("appointments")

    useEffect(() => {
        if (session?.user?.role === "admin") {
            fetchDashboardStats()
        }
    }, [session, timeRange])

    const fetchDashboardStats = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/admin/dashboard/stats?timeRange=${timeRange}`)
            const data = await response.json()

            if (data.success) {
                setStats(data.data)
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to fetch dashboard stats",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch dashboard stats",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleNewNotification = () => {
        // Refresh stats when new notifications arrive
        fetchDashboardStats()
    }

    if (!stats && !loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <p className="text-gray-500">No data available</p>
                </div>
            </div>
        )
    }

    // Transform data for charts
    const userRoleChartData =
        stats?.distributions.userRoles.map((item) => ({
            name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
            value: item.count,
        })) || []

    const appointmentStatusChartData =
        stats?.distributions.appointmentStatus.map((item) => ({
            name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
            value: item.count,
        })) || []

    const departmentChartData =
        stats?.distributions.appointmentsByDepartment.map((item) => ({
            name: item._id,
            appointments: item.count,
        })) || []

    const dailyTrendData =
        stats?.trends.dailyAppointments.map((item) => ({
            name: new Date(item._id).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            appointments: item.count,
        })) || []

    const monthlyRegistrationData =
        stats?.trends.monthlyRegistrations.map((item) => ({
            name: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
            registrations: item.count,
        })) || []

    return (
        <div className="container mx-auto px-4 py-8">
            <RealTimeNotifications onNewNotification={handleNewNotification} />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-2">Comprehensive insights into your healthcare system</p>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="mb-8">
                <FilterPanel
                    timeRange={timeRange}
                    onTimeRangeChange={setTimeRange}
                    period={period}
                    onPeriodChange={setPeriod}
                    metric={metric}
                    onMetricChange={setMetric}
                    onRefresh={fetchDashboardStats}
                    loading={loading}
                />
            </div>

            {loading ? (
                <div className="space-y-8">
                    {/* Loading skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-32 bg-gray-200 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-80 bg-gray-200 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Users"
                            value={stats?.overview.totalUsers || 0}
                            icon={Users}
                            iconColor="text-blue-600"
                            change={{
                                value: 12,
                                type: "increase",
                                period: "last month",
                            }}
                        />
                        <StatCard
                            title="Total Appointments"
                            value={stats?.overview.totalAppointments || 0}
                            icon={Calendar}
                            iconColor="text-green-600"
                            change={{
                                value: 8,
                                type: "increase",
                                period: "last week",
                            }}
                        />
                        <StatCard
                            title="Active Users"
                            value={stats?.overview.activeUsers || 0}
                            icon={UserCheck}
                            iconColor="text-purple-600"
                            description={`${(((stats?.overview.activeUsers || 0) / (stats?.overview.totalUsers || 1)) * 100).toFixed(1)}% of total`}
                        />
                        <StatCard
                            title="Completion Rate"
                            value={`${stats?.metrics.completionRate || 0}%`}
                            icon={CheckCircle}
                            iconColor="text-emerald-600"
                            change={{
                                value: 5,
                                type: "increase",
                                period: "last month",
                            }}
                        />
                    </div>

                    {/* Secondary KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title="Avg Appointments/Day"
                            value={stats?.metrics.avgAppointmentsPerDay || 0}
                            icon={Activity}
                            iconColor="text-orange-600"
                        />
                        <StatCard
                            title="Cancellation Rate"
                            value={`${stats?.metrics.cancellationRate || 0}%`}
                            icon={TrendingDown}
                            iconColor="text-red-600"
                        />
                        <StatCard
                            title="Recent Activity"
                            value={stats?.recentActivity.newAppointments || 0}
                            icon={Clock}
                            iconColor="text-cyan-600"
                            description="New appointments this week"
                        />
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* User Role Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <PieChart className="h-5 w-5 mr-2" />
                                    User Role Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CustomPieChart
                                    data={userRoleChartData}
                                    height={300}
                                    colors={["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]}
                                />
                            </CardContent>
                        </Card>

                        {/* Appointment Status Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <PieChart className="h-5 w-5 mr-2" />
                                    Appointment Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CustomPieChart
                                    data={appointmentStatusChartData}
                                    height={300}
                                    colors={["#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"]}
                                />
                            </CardContent>
                        </Card>

                        {/* Appointments by Department */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <BarChart3 className="h-5 w-5 mr-2" />
                                    Appointments by Department
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CustomBarChart
                                    data={departmentChartData}
                                    height={300}
                                    dataKeys={[
                                        {
                                            key: "appointments",
                                            name: "Appointments",
                                            color: "#3B82F6",
                                        },
                                    ]}
                                />
                            </CardContent>
                        </Card>

                        {/* Daily Appointment Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <TrendingUp className="h-5 w-5 mr-2" />
                                    Daily Appointment Trends
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CustomLineChart
                                    data={dailyTrendData}
                                    height={300}
                                    lines={[
                                        {
                                            key: "appointments",
                                            name: "Appointments",
                                            color: "#10B981",
                                        },
                                    ]}
                                />
                            </CardContent>
                        </Card>

                        {/* Monthly User Registrations */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <TrendingUp className="h-5 w-5 mr-2" />
                                    Monthly User Registrations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CustomAreaChart
                                    data={monthlyRegistrationData}
                                    height={300}
                                    areas={[
                                        {
                                            key: "registrations",
                                            name: "New Registrations",
                                            color: "#8B5CF6",
                                        },
                                    ]}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Performers */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Performing Doctors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats?.topPerformers.doctors.map((doctor, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold">Dr. {doctor.name}</h4>
                                            <p className="text-sm text-gray-600">{doctor.specialization}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">{doctor.appointmentCount}</p>
                                            <p className="text-sm text-gray-600">appointments</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{stats?.recentActivity.newUsers}</p>
                                    <p className="text-sm text-gray-600">New Users</p>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{stats?.recentActivity.newAppointments}</p>
                                    <p className="text-sm text-gray-600">New Appointments</p>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <p className="text-2xl font-bold text-purple-600">{stats?.recentActivity.completedAppointments}</p>
                                    <p className="text-sm text-gray-600">Completed Appointments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
