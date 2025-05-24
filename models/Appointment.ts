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
        enum: ["scheduled", "completed", "cancelled", "no-show"],
        default: "scheduled",
    },
    type: {
        type: String,
        enum: ["initial", "follow-up", "emergency", "routine", "specialist"],
        default: "initial",
    },
    reason: {
        type: String,
        required: true,
    },
    notes: String,
    symptoms: [String],
    diagnosis: [String],
    prescription: [
        {
            medication: String,
            dosage: String,
            frequency: String,
            duration: String,
            notes: String,
        },
    ],
    attachments: [
        {
            name: String,
            url: String,
            type: String,
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    followUpRequired: {
        type: Boolean,
        default: false,
    },
    followUpDate: Date,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    insuranceDetails: {
        provider: String,
        policyNumber: String,
        coverage: String,
        authorizationCode: String,
    },
    billingStatus: {
        type: String,
        enum: ["pending", "billed", "paid", "partially-paid", "insurance-pending"],
        default: "pending",
    },
    paymentDetails: {
        amount: Number,
        method: String,
        transactionId: String,
        paidAt: Date,
    },
    reminders: [
        {
            type: String,
            sentAt: Date,
            method: String, // email, sms, etc.
        },
    ],
})

export default mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema)
