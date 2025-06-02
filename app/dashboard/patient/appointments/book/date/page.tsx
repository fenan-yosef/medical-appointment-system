"use client"

import { useState, useEffect, useMemo } from "react" // Import useMemo
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft } from "lucide-react"

interface TimeSlot {
    start: string // e.g., "09:00"
    end: string   // e.g., "09:30"
    display: string // e.g., "9:00 AM - 9:30 AM"
}

interface Doctor {
    _id: string
    firstName: string
    lastName: string
    specialization: string
    schedule: string // Add schedule to Doctor interface
    department: {
        _id: string
        name: string
    }
}

interface Department {
    _id: string
    name: string
}

export default function BookAppointmentDate() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const departmentId = searchParams?.get("specialty") // ***CHANGED to departmentId***
    const doctorId = searchParams?.get("doctor")
    const { toast } = useToast()

    const [date, setDate] = useState<Date | undefined>(new Date())

    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
    const [loading, setLoading] = useState(true) // Set to true initially
    const [doctor, setDoctor] = useState<Doctor | null>(null)
    const [department, setDepartment] = useState<Department | null>(null)

    // Effect to fetch doctor details when departmentId or doctorId changes
    useEffect(() => {
        if (!departmentId || !doctorId) {
            router.push("/dashboard/patient/appointments/book")
            toast({
                title: "Missing Information",
                description: "Department or Doctor not selected. Please restart the booking process.",
                variant: "destructive",
            });
            return
        }

        const fetchDoctorDetails = async () => {
            setLoading(true) // Start loading for doctor details
            try {
                // Fetch actual doctor details from the new API route
                const response = await fetch(`/api/doctors/${doctorId}`)
                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || "Failed to fetch doctor details")
                }
                const data = await response.json()

                console.log("Doctor fetched: ", data)

                if (data.success && data.data) {
                    setDoctor(data.data)
                    // The department object is already populated within the doctor object
                    setDepartment(data.data.department)
                } else {
                    setDoctor(null)
                    setDepartment(null)
                    toast({
                        title: "Doctor Not Found",
                        description: "Could not retrieve details for the selected doctor.",
                        variant: "destructive",
                    })
                    router.push(`/dashboard/patient/appointments/book/doctor?department=${departmentId}`) // Go back if doctor not found
                }
            } catch (error) {
                console.error("Error fetching doctor details:", error)
                toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to fetch doctor details.",
                    variant: "destructive",
                })
                setDoctor(null)
                setDepartment(null)
                router.push(`/dashboard/patient/appointments/book/doctor?department=${departmentId}`)
            } finally {
                setLoading(false) // Finish loading for doctor details
            }
        }

        fetchDoctorDetails()
    }, [departmentId, doctorId, router, toast]) // Added router and toast to dependencies

    // Function to parse schedule string and generate slots
    const generateTimeSlots = (scheduleString: string, selectedDate: Date | undefined): TimeSlot[] => {
        if (!scheduleString || !selectedDate) return []

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Disable past dates and weekends already handled by Calendar's disabled prop
        // We only generate slots for the selectedDate if it's a valid day.
        const dayOfWeek = selectedDate.getDay(); // 0 for Sunday, 6 for Saturday

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const currentDayName = dayNames[dayOfWeek];

        // Example schedule parsing: "Mon-Fri, 9am-5pm" or "Mon,Wed,Fri, 10am-2pm" or "Sat, 9am-12pm"
        const parts = scheduleString.split(',').map(s => s.trim());
        if (parts.length < 2) return []; // Invalid schedule format

        const daysPart = parts[0];
        const timePart = parts[1];

        let isAvailableToday = false;

        // Check if the current day is included in the schedule days
        if (daysPart.includes(currentDayName)) {
            isAvailableToday = true;
        } else if (daysPart.includes('-')) {
            const [startDay, endDay] = daysPart.split('-');
            const startIndex = dayNames.indexOf(startDay);
            const endIndex = dayNames.indexOf(endDay);
            if (startIndex !== -1 && endIndex !== -1) {
                if (startIndex <= endIndex) {
                    if (dayOfWeek >= startIndex && dayOfWeek <= endIndex) {
                        isAvailableToday = true;
                    }
                } else { // Handles cases like Fri-Mon (wrap around)
                    if (dayOfWeek >= startIndex || dayOfWeek <= endIndex) {
                        isAvailableToday = true;
                    }
                }
            }
        }

        if (!isAvailableToday) {
            return []; // Doctor is not scheduled for this day
        }

        // Parse time part (e.g., "9am-5pm")
        const [startTimeStr, endTimeStr] = timePart.split('-');
        if (!startTimeStr || !endTimeStr) return [];

        const parseTime = (time: string): { hour: number; minute: number } => {
            const lowerTime = time.toLowerCase();
            let hour = parseInt(lowerTime);
            let minute = 0;

            if (lowerTime.includes('am') && hour === 12) hour = 0; // 12am is 0 hours
            if (lowerTime.includes('pm') && hour !== 12) hour += 12; // 12pm is 12 hours

            if (lowerTime.includes(':')) {
                const [h, m] = lowerTime.split(':');
                hour = parseInt(h);
                minute = parseInt(m.substring(0, 2));
                if (lowerTime.includes('pm') && hour !== 12) hour += 12;
                if (lowerTime.includes('am') && hour === 12) hour = 0;
            }
            return { hour, minute };
        };

        const { hour: startHour, minute: startMinute } = parseTime(startTimeStr);
        const { hour: endHour, minute: endMinute } = parseTime(endTimeStr);

        const generatedSlots: TimeSlot[] = [];
        let currentSlotTime = new Date(selectedDate);
        currentSlotTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(selectedDate);
        endTime.setHours(endHour, endMinute, 0, 0);

        const appointmentDurationMinutes = 30; // Assuming 30-minute slots

        while (currentSlotTime.getTime() < endTime.getTime()) {
            const slotEnd = new Date(currentSlotTime.getTime() + appointmentDurationMinutes * 60 * 1000);

            if (slotEnd.getTime() > endTime.getTime()) {
                break; // Don't create slots that extend beyond the end time
            }

            // Convert to 12-hour format for display
            const formatTime = (dateObj: Date) => {
                let hours = dateObj.getHours();
                const minutes = dateObj.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                const strMinutes = minutes < 10 ? '0' + minutes : minutes;
                return `${hours}:${strMinutes} ${ampm}`;
            };

            const slot: TimeSlot = {
                start: `${currentSlotTime.getHours().toString().padStart(2, '0')}:${currentSlotTime.getMinutes().toString().padStart(2, '0')}`,
                end: `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`,
                display: `${formatTime(currentSlotTime)} - ${formatTime(slotEnd)}`,
            };
            generatedSlots.push(slot);

            currentSlotTime = slotEnd; // Move to the next slot
        }

        return generatedSlots;
    };


    // Effect to generate time slots when date or doctor's schedule changes
    useEffect(() => {
        if (doctor && doctor.schedule && date) {
            setLoading(true);
            // Simulate API call for time slots, but this time, generate them
            // based on the doctor's actual schedule.
            // In a real app, you would also fetch existing appointments for the day
            // and filter them out from the generated slots here.
            setTimeout(() => {
                const generated = generateTimeSlots(doctor.schedule, date);
                setTimeSlots(generated);
                setSelectedTimeSlot(null); // Reset selected time slot on date change
                setLoading(false);
            }, 300); // Small delay to simulate fetching
        } else {
            setTimeSlots([]); // Clear slots if no doctor or schedule
            setSelectedTimeSlot(null);
            setLoading(false);
        }
    }, [date, doctor]); // Depend on date and doctor object (specifically doctor.schedule)

    const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
        setSelectedTimeSlot(timeSlot)
    }

    const formatDateForDisplay = (date: Date | undefined) => {
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
                    onClick={() => router.push(`/dashboard/patient/appointments/book/doctor?department=${departmentId}`)}
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
                <h1 className="text-3xl font-bold mb-2">
                    Book Appointment with Dr. {doctor?.firstName} {doctor?.lastName}
                </h1>
                <p className="text-gray-600 mb-6">
                    Specialty: {doctor?.specialization || department?.name}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-lg font-medium mb-4">Select Date</h2>
                        <Card>
                            <CardContent className="p-4">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-md border"
                                    disabled={(currentDate) => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0); // Set to start of today
                                        const dayOfWeek = currentDate.getDay();
                                        return currentDate < today || dayOfWeek === 0 || dayOfWeek === 6; // Disable past dates and weekends
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <h2 className="text-lg font-medium mb-4">
                            Available Time Slots for {formatDateForDisplay(date)}
                        </h2>
                        <Card>
                            <CardContent className="p-4">
                                {loading && !timeSlots.length ? ( // Show loading skeleton only if slots are empty
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                                        ))}
                                    </div>
                                ) : timeSlots.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">
                                            No available time slots for {formatDateForDisplay(date)}.
                                            {doctor && !generateTimeSlots(doctor.schedule, date).length && " Dr. " + doctor.lastName + " is not scheduled for this day."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {timeSlots.map((slot, index) => (
                                            <Button
                                                key={index}
                                                variant={selectedTimeSlot?.start === slot.start ? "default" : "outline"}
                                                className="w-full justify-center"
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

                <div className="mt-8 flex justify-end">
                    <Button
                        onClick={() => {
                            if (selectedTimeSlot && date && doctor && departmentId) {
                                const formattedDate = date.toISOString().split("T")[0]
                                router.push(
                                    `/dashboard/patient/appointments/book/review?department=${departmentId}&doctor=${doctor._id}&date=${formattedDate}&timeStart=${selectedTimeSlot.start}&timeEnd=${selectedTimeSlot.end}`,
                                )
                            } else {
                                toast({
                                    title: "Selection Incomplete",
                                    description: "Please select a date and a time slot to proceed.",
                                    variant: "destructive",
                                })
                            }
                        }}
                        className="w-full md:w-auto"
                        disabled={!selectedTimeSlot || !date || loading}
                    >
                        Next: Review Appointment
                    </Button>
                </div>
            </div>
        </div>
    )
}
