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
    const specialty = searchParams?.get("specialty")
    const doctorId = searchParams?.get("doctor")
    const dateStr = searchParams?.get("date")
    const timeStart = searchParams?.get("timeStart")
    const timeEnd = searchParams?.get("timeEnd")
    const { toast } = useToast()

    const [reason, setReason] = useState("")
    const [loading, setLoading] = useState(false)
    const [doctor, setDoctor] = useState<Doctor | null>(null)
    const [department, setDepartment] = useState<Department | null>(null)

    useEffect(() => {
        if (!specialty || !doctorId || !dateStr || !timeStart || !timeEnd) {
            router.push("/dashboard/patient/appointments/book")
            return
        }

        // Fetch doctor and department details
        fetchDetails()
    }, [specialty, doctorId])

    const fetchDetails = async () => {
        try {
            // This would be a real API call in a production app
            // For now, we'll simulate it
            setDoctor({
                _id: doctorId || "",
                firstName: "Selamawit",
                lastName: "Abebe",
                specialization: "Cardiology",
            })

            setDepartment({
                _id: specialty || "",
                name: "Cardiology",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch details",
                variant: "destructive",
            })
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
                department: specialty,
                date: dateStr,
                time: {
                    start: timeStart,
                    end: timeEnd,
                },
                reason: reason,
                type: "initial",
            }

            const response = await fetch("/api/patient/appointments", {
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
                        router.push(`/dashboard/patient/appointments/book/date?specialty=${specialty}&doctor=${doctorId}`)
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
                <h1 className="text-3xl font-bold mb-2">Review Appointment</h1>
                <p className="text-gray-600 mb-6">Please review your appointment details before confirming</p>

                <Card className="mb-6">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm text-gray-500 mb-1">Specialty</h3>
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
            </div>
        </div>
    )
}
