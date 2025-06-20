"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Appointment {
    _id: string
    doctor: {
        _id: string
        firstName: string
        lastName: string
        email: string
    }
    department: {
        _id: string
        name: string
    }
    date: string
    time: {
        start: string
        end: string
    }
    status: string
    type: string
    reason: string
}

export default function PatientDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { toast } = useToast()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("upcoming")

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        } else if (status === "authenticated") {
            fetchAppointments(activeTab)
        }
    }, [status, activeTab])

    const fetchAppointments = async (status: string) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/patients/appointments?status=${status}`)
            const data = await response.json()

            if (data.success) {
                setAppointments(data.data)
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to fetch appointments",
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch appointments",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        })
    }

    const formatTime = (timeString: string) => {
        const [hours, minutes] = timeString.split(":")
        const hour = Number.parseInt(hours)
        const ampm = hour >= 12 ? "PM" : "AM"
        const hour12 = hour % 12 || 12
        return `${hour12}:${minutes} ${ampm}`
    }

    const getAppointmentImage = (specialty: string): string => {
        // Lorem Picsum provides random images.
        // You can use a seed for somewhat consistent "randomness" for the same specialty.
        // A simple hash of the specialty name can serve as a seed.
        // For a simple hash, you could convert the string to a number.
        const getHashOfString = (str: string): number => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash |= 0; // Convert to 32bit integer
            }
            return Math.abs(hash); // Ensure positive
        };

        const seed = getHashOfString(specialty.toLowerCase());

        // Lorem Picsum format: https://picsum.photos/seed/{seed}/width/height
        // You can adjust width and height as needed.
        const width = 400; // Example width
        const height = 300; // Example height, suitable for doctor portraits

        // Map common specialties to specific seeds or just use a generic random for all
        // For simplicity, we'll just use the hash of the specialty.
        // If you want specific images for specific specialties, you'd need more control,
        // possibly by using a smaller range of seeds or hand-picking image IDs if Lorem Picsum allowed it easily (it doesn't directly).

        // Using Lorem Picsum with a seed based on the specialty name
        return `https://picsum.photos/seed/doctor/500/500`;
        // Alternative: purely random image (different image every time)
        // return `https://picsum.photos/${seed}${width}/${height}`;
    };


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Appointments</h1>
                <Button
                    onClick={() => router.push("/dashboard/patient/appointments/book")}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="mr-2 h-4 w-4" /> Book Appointment
                </Button>
            </div>

            <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardContent className="p-6">
                                        <div className="h-24 bg-gray-200 rounded"></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 mb-4">You don't have any upcoming appointments</p>
                            <Button
                                onClick={() => router.push("/dashboard/patient/appointments/book")}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Book Your First Appointment
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {appointments.map((appointment) => (
                                <div key={appointment._id} className="flex items-center border rounded-lg overflow-hidden">
                                    <div className="flex-1 p-6">
                                        <div className="text-sm text-gray-500 mb-1">Appointment</div>
                                        <h3 className="text-lg font-medium">
                                            Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                                        </h3>
                                        <p className="text-gray-600">{appointment.department.name}</p>

                                        <div className="mt-4 inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {formatDate(appointment.date)}
                                            <span className="mx-2">•</span>
                                            <Clock className="h-4 w-4 mr-2" />
                                            {formatTime(appointment.time.start)}
                                        </div>
                                    </div>

                                    <div className="w-64 h-32 bg-teal-500 flex-shrink-0">
                                        <img
                                            src={`https://picsum.photos/seed/doctor/40/40`}
                                            alt={`Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="past">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardContent className="p-6">
                                        <div className="h-24 bg-gray-200 rounded"></div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">You don't have any past appointments</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {appointments.map((appointment) => (
                                <div key={appointment._id} className="flex items-center border rounded-lg overflow-hidden">
                                    <div className="flex-1 p-6">
                                        <div className="text-sm text-gray-500 mb-1">Appointment</div>
                                        <h3 className="text-lg font-medium">
                                            Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                                        </h3>
                                        <p className="text-gray-600">{appointment.department.name}</p>

                                        <div className="mt-4 inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {formatDate(appointment.date)}
                                            <span className="mx-2">•</span>
                                            <Clock className="h-4 w-4 mr-2" />
                                            {formatTime(appointment.time.start)}
                                        </div>

                                        <div className="mt-2">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appointment.status === "completed"
                                                    ? "bg-green-100 text-green-800"
                                                    : appointment.status === "cancelled"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                            >
                                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-64 h-32 bg-teal-500 flex-shrink-0">
                                        <img
                                            src={getAppointmentImage(appointment.department.name) || "/placeholder.svg"}
                                            alt={`Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
