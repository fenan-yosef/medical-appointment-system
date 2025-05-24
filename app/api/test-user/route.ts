import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/db"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export async function GET() {
    try {
        await connectToDatabase()

        // Check if test user exists
        const existingUser = await User.findOne({ email: "test@example.com" })

        if (existingUser) {
            return NextResponse.json({
                message: "Test user already exists",
                userId: existingUser._id.toString(),
            })
        }

        // Create test user if it doesn't exist
        const hashedPassword = await bcrypt.hash("password123", 10)

        const newUser = await User.create({
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
            password: hashedPassword,
            role: "admin",
            gender: "prefer not to say",
            isActive: true,
            isEmailVerified: true,
        })

        return NextResponse.json({
            message: "Test user created successfully",
            userId: newUser._id.toString(),
        })
    } catch (error: any) {
        console.error("Error creating test user:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
