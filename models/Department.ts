import mongoose from "mongoose"

const DepartmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    description: String,
    head: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    location: {
        building: String,
        floor: String,
        roomNumber: String,
    },
    contactInfo: {
        email: String,
        phone: String,
        extension: String,
    },
    specialties: [String],
    isActive: {
        type: Boolean,
        default: true,
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

export default mongoose.models.Department || mongoose.model("Department", DepartmentSchema)
