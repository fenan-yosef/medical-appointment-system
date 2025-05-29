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
    medicalHistory: [{
        _id: false, // Added _id: false for consistency
        condition: String,
        diagnosedDate: Date,
        notes: String,
    }],
    insurance: {
        _id: false, // Added _id: false for consistency
        provider: String,
        policyNumber: String,
        groupNumber: String, // Added groupNumber as it was in the original IUser but not schema
        expiryDate: Date,
    },
    // New Patient Record Fields
    allergies: {
        type: [String],
        default: [],
    },
    currentMedications: {
        type: [{
            _id: false,
            name: String,
            dosage: String,
            frequency: String,
        }],
        default: [],
    },
    pastSurgeries: {
        type: [{
            _id: false,
            name: String,
            date: Date,
            notes: String,
        }],
        default: [],
    },
    familyHistory: {
        type: [{
            _id: false,
            relative: String,
            condition: String,
            notes: String,
        }],
        default: [],
    },
    bloodType: {
        type: String,
        trim: true,
    },
    vaccinations: {
        type: [{
            _id: false,
            vaccineName: String,
            dateAdministered: Date,
            nextDueDate: Date,
        }],
        default: [],
    },
    // createdAt and updatedAt are now handled by { timestamps: true }
    // So, removing these explicit definitions with defaults
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
}, { timestamps: true })

// Combined and cleaned up pre-save hook for password hashing.
// The explicit updatedAt hook is removed as timestamps: true handles it.
UserSchema.pre("save", async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (this.isModified("password")) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        } catch (err: any) { // Added type for err
            return next(err); // Pass errors to Mongoose
        }
    }
    next();
})

// Method to check if password matches
UserSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password)
}

export default mongoose.models.User || mongoose.model("User", UserSchema)
