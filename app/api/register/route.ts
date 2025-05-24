import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import User from "@/models/User"

export async function POST(req: NextRequest) {
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            password, 
            gender, 
            role,
            phoneNumber,
            address, // { street, city, state, zipCode, country }
            dateOfBirth, // string, will be converted to Date
            emergencyContact, // { name, relationship, phoneNumber }
            insurance // { provider, policyNumber, expiryDate }
        } = await req.json()

        // Validate input
        if (!firstName || !lastName || !email || !password || !dateOfBirth) {
            return NextResponse.json({ message: "Missing required fields (firstName, lastName, email, password, dateOfBirth are mandatory)" }, { status: 400 })
        }

        // Connect to database
        await connectToDatabase()

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
        }

        // Create new user
        const user = await User.create({
            firstName,
            lastName,
            email,
            password, // Will be hashed by the pre-save hook
            gender,
            role: role || "patient", // Default to patient if no role provided
            phoneNumber,
            address,
            dateOfBirth: new Date(dateOfBirth),
            emergencyContact,
            insurance,
        })

        // Remove password from response
        const newUser = user.toObject()
        delete newUser.password

        return NextResponse.json({ message: "User registered successfully", user: newUser }, { status: 201 })
    } catch (error: any) {
        console.error("Registration error:", error)
        return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 })
    }
}
