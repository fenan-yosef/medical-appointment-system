import mongoose from "mongoose";

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
});

// Define the IDepartment interface
export type IDepartment = {
    _id: string; // MongoDB ObjectId as a string
    name: string;
    description?: string;
    head?: string; // ObjectId of the User model
    location?: {
        building?: string;
        floor?: string;
        roomNumber?: string;
    };
    contactInfo?: {
        email?: string;
        phone?: string;
        extension?: string;
    };
    specialties?: string[];
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

// Default export for the Department model
export default mongoose.models.Department || mongoose.model("Department", DepartmentSchema);
