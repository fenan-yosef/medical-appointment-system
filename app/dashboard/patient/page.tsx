import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Calendar, Clock, AlertCircle, CheckCircle2, Plus, User2, Stethoscope } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
    const session = await getServerSession()

    if (!session?.user) {
        redirect("/login")
    }

    // Mock data for demonstration (replace with real data from your backend)
    const appointments = [
        {
            id: 1,
            date: "2024-06-01",
            time: "09:30 AM",
            department: "Cardiology",
            doctor: "Dr. Smith",
            status: "confirmed",
            note: "Routine check-up",
        },
        {
            id: 2,
            date: "2024-05-20",
            time: "11:00 AM",
            department: "Dermatology",
            doctor: "Dr. Lee",
            status: "completed",
            note: "Skin rash consultation",
        },
        {
            id: 3,
            date: "2024-05-10",
            time: "02:00 PM",
            department: "Neurology",
            doctor: "Dr. Johnson",
            status: "cancelled",
            note: "Migraine follow-up",
        },
    ]

    // Find next upcoming appointment
    const now = new Date()
    const nextAppointment = appointments.find(app => new Date(app.date) >= now && app.status === "confirmed")

    return (
        <div className="max-w-4xl mx-auto py-8 px-2 md:px-0 space-y-8">
            {/* Welcome */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Welcome, {session.user.name?.split(" ")[0] || "Patient"}!</h2>
                    <p className="text-muted-foreground">
                        Here you can view your upcoming and past appointments, and book new ones.
                    </p>
                </div>
                <Button asChild className="w-full md:w-auto">
                    <Link href="/appointments/add">
                        <Plus className="mr-2 h-4 w-4" /> Book New Appointment
                    </Link>
                </Button>
            </div>

            {/* Next Appointment */}
            <Card className="border-blue-100 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-lg font-semibold">Your Next Appointment</CardTitle>
                        <CardDescription>
                            {nextAppointment
                                ? `Don't forget your upcoming appointment!`
                                : "You have no upcoming appointments."}
                        </CardDescription>
                    </div>
                    <Calendar className="h-6 w-6 text-blue-400" />
                </CardHeader>
                <CardContent>
                    {nextAppointment ? (
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-blue-100 p-2">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="font-medium text-lg">{nextAppointment.date} at {nextAppointment.time}</div>
                                    <div className="text-sm text-gray-600">{nextAppointment.department} &middot; {nextAppointment.doctor}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {nextAppointment.status === "confirmed" && (
                                    <span className="flex items-center text-green-600 text-sm font-medium">
                                        <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmed
                                    </span>
                                )}
                                {nextAppointment.status === "pending" && (
                                    <span className="flex items-center text-yellow-600 text-sm font-medium">
                                        <AlertCircle className="h-4 w-4 mr-1" /> Pending
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-500">No upcoming appointments. <Link href="/appointments/add" className="text-blue-600 underline">Book one now</Link>.</div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Appointments */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Appointments</CardTitle>
                    <CardDescription>
                        Review your recent appointments and their status.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="divide-y">
                        {appointments.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">No appointments found.</div>
                        ) : (
                            appointments.map(app => (
                                <div key={app.id} className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-full bg-gray-100 p-2">
                                            <Stethoscope className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{app.department} with {app.doctor}</div>
                                            <div className="text-sm text-gray-600">{app.date} at {app.time}</div>
                                            <div className="text-xs text-gray-400">{app.note}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {app.status === "confirmed" && (
                                            <span className="flex items-center text-green-600 text-sm font-medium">
                                                <CheckCircle2 className="h-4 w-4 mr-1" /> Confirmed
                                            </span>
                                        )}
                                        {app.status === "completed" && (
                                            <span className="flex items-center text-gray-500 text-sm font-medium">
                                                <CheckCircle2 className="h-4 w-4 mr-1" /> Completed
                                            </span>
                                        )}
                                        {app.status === "cancelled" && (
                                            <span className="flex items-center text-red-500 text-sm font-medium">
                                                <AlertCircle className="h-4 w-4 mr-1" /> Cancelled
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
