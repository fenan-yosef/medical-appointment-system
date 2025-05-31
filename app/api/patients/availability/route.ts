import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Appointment from "@/models/Appointment"
import DoctorAvailability from "@/models/DoctorAvailability" // Assuming you have this model

// GET available time slots for a doctor on a specific date
export async function GET(request: NextRequest) {
    try {
        await dbConnect()
        const { searchParams } = new URL(request.url)
        const doctorId = searchParams.get("doctor")
        const dateStr = searchParams.get("date")

        if (!doctorId || !dateStr) {
            return NextResponse.json({ error: "Doctor ID and date are required" }, { status: 400 })
        }

        const date = new Date(dateStr)

        // Get doctor's availability for the day
        const availability = await DoctorAvailability.findOne({
            doctor: doctorId,
            dayOfWeek: date.getDay(), // 0 for Sunday, 1 for Monday, etc.
        })

        if (!availability || !availability.isAvailable) {
            return NextResponse.json({
                success: true,
                data: { available: false, timeSlots: [] },
            })
        }

        // Generate time slots based on availability
        const startTime = availability.startTime || "09:00"
        const endTime = availability.endTime || "17:00"
        const slotDuration = availability.slotDuration || 30 // minutes

        // Get already booked appointments for this doctor on this date
        const bookedAppointments = await Appointment.find({
            doctor: doctorId,
            date: {
                $gte: new Date(date.setHours(0, 0, 0)),
                $lt: new Date(date.setHours(23, 59, 59)),
            },
            status: { $nin: ["cancelled"] },
        }).select("time")

        // Generate all possible time slots
        const timeSlots = generateTimeSlots(startTime, endTime, slotDuration)

        // Filter out booked slots
        const availableSlots = timeSlots.filter((slot) => {
            return !bookedAppointments.some((appt) => appt.time.start === slot.start && appt.time.end === slot.end)
        })

        return NextResponse.json({
            success: true,
            data: {
                available: true,
                timeSlots: availableSlots,
            },
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Helper function to generate time slots
function generateTimeSlots(startTime: string, endTime: string, slotDuration: number) {
    const slots = []
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    let currentHour = startHour
    let currentMinute = startMinute

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const startTimeStr = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`

        // Calculate end time
        let endTimeHour = currentHour
        let endTimeMinute = currentMinute + slotDuration

        if (endTimeMinute >= 60) {
            endTimeHour += Math.floor(endTimeMinute / 60)
            endTimeMinute = endTimeMinute % 60
        }

        // Skip if end time exceeds doctor's availability
        if (endTimeHour > endHour || (endTimeHour === endHour && endTimeMinute > endMinute)) {
            break
        }

        const endTimeStr = `${endTimeHour.toString().padStart(2, "0")}:${endTimeMinute.toString().padStart(2, "0")}`

        slots.push({
            start: startTimeStr,
            end: endTimeStr,
            display: `${formatTime(startTimeStr)} - ${formatTime(endTimeStr)}`,
        })

        // Move to next slot
        currentMinute += slotDuration
        if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60)
            currentMinute = currentMinute % 60
        }
    }

    return slots
}

// Helper function to format time in 12-hour format
function formatTime(time: string) {
    const [hour, minute] = time.split(":").map(Number)
    const period = hour >= 12 ? "PM" : "AM"
    const hour12 = hour % 12 || 12
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`
}
