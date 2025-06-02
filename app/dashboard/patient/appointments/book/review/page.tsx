"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, Calendar, Clock } from "lucide-react"

interface Doctor {
    _id: string
    firstName: string
    lastName: string
    specialization: string
}

interface Department {
    _id: string
    name: string
}

export default function BookAppointmentReview() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // const specialty = searchParams?.get("specialty") // Old
    const departmentIdFromQuery = searchParams?.get("department") // New: Read 'department'
    const doctorId = searchParams?.get("doctor")
    const dateStr = searchParams?.get("date")
    const timeStart = searchParams?.get("timeStart")
    const timeEnd = searchParams?.get("timeEnd")
    const { toast } = useToast()

    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(true) // Set to true initially to load details
    const [doctor, setDoctor] = useState<Doctor | null>(null)
    const [department, setDepartment] = useState<Department | null>(null)

    useEffect(() => {
        // Use departmentIdFromQuery in the check
        if (!departmentIdFromQuery || !doctorId || !dateStr || !timeStart || !timeEnd) {
            toast({
                title: "Missing Information",
                description: "Required appointment details are missing. Please restart the booking process.",
                variant: "destructive",
            });
            router.push("/dashboard/patient/appointments/book")
            return
        }

        // Fetch doctor and department details
        fetchDetails(doctorId, departmentIdFromQuery) // Pass IDs to fetchDetails
    }, [departmentIdFromQuery, doctorId, dateStr, timeStart, timeEnd, router, toast]) // Added all dependencies

    const fetchDetails = async (docId: string, deptId: string) => {
        setLoading(true);
        try {
            // Fetch actual doctor details (which includes populated department)
            const doctorResponse = await fetch(`/api/doctors/${docId}`);
            if (!doctorResponse.ok) {
                const errorData = await doctorResponse.json();
                throw new Error(errorData.error || "Failed to fetch doctor details");
            }
            const doctorData = await doctorResponse.json();

            if (doctorData.success && doctorData.data) {
                setDoctor(doctorData.data);
                // The department object is populated within the doctor object from /api/doctors/[id]
                if (doctorData.data.department) {
                    setDepartment(doctorData.data.department);
                } else {
                    // Fallback or error if department is not populated as expected
                    // This might require fetching department details separately if not always populated
                    // For now, let's assume it's populated or handle error
                    console.warn("Department details not populated in doctor object");
                    // You might need a separate fetch for department if /api/doctors/[id] doesn't always populate it
                    // or if the department ID from query is the only source and doctor's department might differ.
                    // For simplicity, if doctorData.data.department is not there, we might need another fetch
                    // or rely on a department name passed via query (which is not the case here).
                    // For now, we'll rely on the populated department from the doctor object.
                    // If departmentIdFromQuery is the source of truth for the department context of booking:
                    // setDepartment({ _id: deptId, name: "Loading..." }); // Placeholder, then fetch name
                }
            } else {
                throw new Error(doctorData.error || "Doctor details not found");
            }
        } catch (error) {
            toast({
                title: "Error Fetching Details",
                description: error instanceof Error ? error.message : "Could not load appointment details.",
                variant: "destructive",
            })
            // Redirect if essential data can't be fetched
            router.push(`/dashboard/patient/appointments/book/date?department=${departmentIdFromQuery}&doctor=${docId}`);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast({
                title: "Please provide a reason for your visit",
                variant: "destructive",
            })
            return
        }

        setLoading(true)
        try {
            const appointmentData = {
                doctor: doctorId,
                department: departmentIdFromQuery, // Use departmentIdFromQuery
                date: dateStr,
                time: {
                    start: timeStart,
                    end: timeEnd,
                },
                reason: reason,
                type: "initial",
            }

            const response = await fetch("/api/patients/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(appointmentData),
            })

            const data = await response.json()

            if (data.success) {
                toast({
                    title: "Appointment booked successfully",
                    description: "Your appointment has been confirmed",
                })
                router.push("/dashboard/patient")
            } else {
                throw new Error(data.error || "Failed to book appointment")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to book appointment",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return ""
        const date = new Date(dateStr)
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        })
    }

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return ""
        const [hours, minutes] = timeStr.split(":")
        const hour = Number.parseInt(hours)
        const ampm = hour >= 12 ? "PM" : "AM"
        const hour12 = hour % 12 || 12
        return `${hour12}:${minutes} ${ampm}`
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() =>
                        // Use departmentIdFromQuery for the back button
                        router.push(`/dashboard/patient/appointments/book/date?department=${departmentIdFromQuery}&doctor=${doctorId}`)
                    }
                    className="mb-4"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                <div className="flex items-center">
                    <div className="text-sm text-gray-500">
                        <span>Book Appointment</span>
                        <span className="mx-2">/</span>
                        <span>Select Doctor</span>
                        <span className="mx-2">/</span>
                        <span className="font-medium text-black">Review</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                {loading && (
                    <div className="text-center">
                        <p>Loading review details...</p>
                        {/* You can add a spinner here */}
                    </div>
                )}
                {!loading && doctor && department && (
                    <>
                        <h1 className="text-3xl font-bold mb-2">Review Appointment</h1>
                        <p className="text-gray-600 mb-6">Please review your appointment details before confirming</p>

                        <Card className="mb-6">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm text-gray-500 mb-1">Department</h3>
                                        <p className="font-medium">{department?.name}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm text-gray-500 mb-1">Doctor</h3>
                                        <p className="font-medium">
                                            Dr. {doctor?.firstName} {doctor?.lastName}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm text-gray-500 mb-1">Date</h3>
                                        <p className="font-medium flex items-center">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {formatDate(dateStr ?? null)}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm text-gray-500 mb-1">Time</h3>
                                        <p className="font-medium flex items-center">
                                            <Clock className="h-4 w-4 mr-2" />
                                            {formatTime(timeStart ?? null)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-2">Reason for Visit</h3>
                            <Textarea
                                placeholder="Please describe the reason for your appointment..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                required
                            />
                        </div>

                        <Button onClick={handleSubmit} className="w-full md:w-auto" disabled={loading || !reason.trim()}>
                            {loading ? "Booking..." : "Confirm Appointment"}
                        </Button>
                    </>
                )}
                {!loading && (!doctor || !department) && (
                    <div className="text-center text-red-500">
                        <p>Could not load appointment details. Please try again.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
