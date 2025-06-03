import mongoose from "mongoose"

const AppointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        start: {
            type: String,
            required: true,
        },
        end: {
            type: String,
            required: true,
        },
    },
    status: {
        type: String,
        enum: ["scheduled", "confirmed", "completed", "cancelled", "no-show", "rescheduled"],
        default: "scheduled",
    },
    type: {
        type: String,
        enum: ["initial", "follow-up", "emergency", "consultation"],
        default: "initial",
    },
    reason: {
        type: String,
        required: true,
    },
    notes: {
        type: String,
    },
    // Private notes only accessible to the doctor
    doctorNotes: {
        type: String,
    },
    // Patient contact information snapshot
    patientContact: {
        phone: String,
        email: String,
    },
    attachments: [
        {
            filename: String,
            url: String,
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
})

// Indexes for efficient queries
AppointmentSchema.index({ doctor: 1, date: 1 })
AppointmentSchema.index({ patient: 1, date: 1 })
AppointmentSchema.index({ status: 1, date: 1 })

export default mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema)
