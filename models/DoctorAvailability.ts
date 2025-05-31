import mongoose from "mongoose"

const DoctorAvailabilitySchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    dayOfWeek: {
        type: Number, // 0 for Sunday, 1 for Monday, etc.
        required: true,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    startTime: {
        type: String, // Format: "HH:MM" in 24-hour format
        default: "09:00",
    },
    endTime: {
        type: String, // Format: "HH:MM" in 24-hour format
        default: "17:00",
    },
    slotDuration: {
        type: Number, // in minutes
        default: 30,
    },
    breakTimes: [
        {
            start: String, // Format: "HH:MM" in 24-hour format
            end: String, // Format: "HH:MM" in 24-hour format
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
})

// Compound index to ensure a doctor can only have one availability record per day
DoctorAvailabilitySchema.index({ doctor: 1, dayOfWeek: 1 }, { unique: true })

export default mongoose.models.DoctorAvailability || mongoose.model("DoctorAvailability", DoctorAvailabilitySchema)
