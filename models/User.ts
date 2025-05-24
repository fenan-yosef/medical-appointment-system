import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minlength: 6,
        select: false,
    },
    firstName: {
        type: String,
        required: [true, "Please provide a first name"],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, "Please provide a last name"],
        trim: true,
    },
    role: {
        type: String,
        enum: ["admin", "doctor", "receptionist", "patient"],
        default: "patient",
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ["male", "female", "other", "prefer not to say"],
    },
    profileImage: String,
    specialization: String, // For doctors
    licenseNumber: String, // For doctors
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phoneNumber: String,
    },
    medicalHistory: [
        {
            condition: String,
            diagnosedDate: Date,
            notes: String,
        },
    ],
    insurance: {
        provider: String,
        policyNumber: String,
        expiryDate: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    lastLogin: Date,
    isActive: {
        type: Boolean,
        default: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
})

// Hash password before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

// Method to check if password matches
UserSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password)
}

export default mongoose.models.User || mongoose.model("User", UserSchema)
