"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TimeSlot {
    start: string
    end: string
    display: string
}

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

export default function BookAppointmentDate() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const specialty = searchParams?.get("specialty")
    const doctorId = searchParams?.get("doctor")
    const { toast } = useToast()

    const [date, setDate] = useState<Date | undefined>(new Date())

    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
    const [loading, setLoading] = useState(false)
    const [doctor, setDoctor] = useState<Doctor | null>(null)
    const [department, setDepartment] = useState<Department | null>(null)

    useEffect(() => {
        if (!specialty || !doctorId) {
            router.push("/dashboard/patient/appointments/book")
            return
        }

        // Fetch doctor details
        fetchDoctor()
    }, [specialty, doctorId])

    useEffect(() => {
        if (date) {
            fetchAvailableTimeSlots()
        }
    }, [date, doctorId])

    const fetchDoctor = async () => {
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
                description: "Failed to fetch doctor details",
                variant: "destructive",
            })
        }
    }

    const fetchAvailableTimeSlots = async () => {
        if (!date || !doctorId) return

        setLoading(true)
        try {
            // In a real app, this would be an API call
            // For now, we'll simulate available time slots
            const formattedDate = date.toISOString().split("T")[0]

            // Simulate API response
            setTimeout(() => {
                const slots: TimeSlot[] = [
                    { start: "09:00", end: "09:30", display: "9:00 AM - 9:30 AM" },
                    { start: "09:30", end: "10:00", display: "9:30 AM - 10:00 AM" },
                    { start: "10:00", end: "10:30", display: "10:00 AM - 10:30 AM" },
                    { start: "10:30", end: "11:00", display: "10:30 AM - 11:00 AM" },
                    { start: "11:00", end: "11:30", display: "11:00 AM - 11:30 AM" },
                    { start: "11:30", end: "12:00", display: "11:30 AM - 12:00 PM" },
                    { start: "14:00", end: "14:30", display: "2:00 PM - 2:30 PM" },
                    { start: "14:30", end: "15:00", display: "2:30 PM - 3:00 PM" },
                    { start: "15:00", end: "15:30", display: "3:00 PM - 3:30 PM" },
                    { start: "15:30", end: "16:00", display: "3:30 PM - 4:00 PM" },
                    { start: "16:00", end: "16:30", display: "4:00 PM - 4:30 PM" },
                ]

                setTimeSlots(slots)
                setLoading(false)
            }, 500)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch available time slots",
                variant: "destructive",
            })
            setLoading(false)
        }
    }

    const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
        setSelectedTimeSlot(timeSlot)
    }

    const formatDate = (date: Date | undefined) => {
        if (!date) return ""
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        })
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/dashboard/patient/appointments/book/doctor?specialty=${specialty}`)}
                    className="mb-4"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                <div className="flex items-center">
                    <div className="text-sm text-gray-500">
                        <span>Doctor</span>
                        <span className="mx-2">/</span>
                        <span className="font-medium text-black">Date & Time</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Manage Availability</h1>
                <p className="text-gray-600 mb-6">
                    Select a date and time for your appointment with Dr. {doctor?.firstName} {doctor?.lastName}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-lg font-medium mb-4">Select Date</h2>
                        <Card>
                            <CardContent className="p-4">

                                {/* <div className="flex justify-between items-center mb-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const prevMonth = new Date(date!)
                                            prevMonth.setMonth(prevMonth.getMonth() - 1)
                                            setDate(prevMonth)
                                        }}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <h3 className="font-medium">
                                        {date?.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const nextMonth = new Date(date!)
                                            nextMonth.setMonth(nextMonth.getMonth() + 1)
                                            setDate(nextMonth)
                                        }}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div> */}

                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-md border"
                                    disabled={(date) => {
                                        // Disable past dates and weekends
                                        const today = new Date()
                                        today.setHours(0, 0, 0, 0)
                                        const day = date.getDay()
                                        return date < today || day === 0 || day === 6
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <h2 className="text-lg font-medium mb-4">Select Time Slots</h2>
                        <Card>
                            <CardContent className="p-4">
                                {loading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                                        ))}
                                    </div>
                                ) : timeSlots.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">No available time slots for {formatDate(date)}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {timeSlots.map((slot, index) => (
                                            <Button
                                                key={index}
                                                variant={selectedTimeSlot === slot ? "default" : "outline"}
                                                className="w-full justify-start"
                                                onClick={() => handleTimeSlotSelect(slot)}
                                            >
                                                {slot.display}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="mt-8">
                    <Button
                        onClick={() => {
                            if (selectedTimeSlot && date) {
                                const formattedDate = date.toISOString().split("T")[0]
                                router.push(
                                    `/dashboard/patient/appointments/book/review?specialty=${specialty}&doctor=${doctorId}&date=${formattedDate}&timeStart=${selectedTimeSlot.start}&timeEnd=${selectedTimeSlot.end}`,
                                )
                            } else {
                                toast({
                                    title: "Please select a date and time",
                                    variant: "destructive",
                                })
                            }
                        }}
                        className="w-full md:w-auto"
                        disabled={!selectedTimeSlot || !date}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
