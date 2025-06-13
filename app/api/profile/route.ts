// Import necessary modules and utilities
import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import dbConnect from "@/lib/db" // Database connection utility
import User from "@/models/User" // User model
import { authOptions } from "@/lib/auth" // Authentication options

// GET handler for fetching user profile
export async function GET(request: NextRequest) {
    try {
        // Establish database connection
        await dbConnect()
        // Retrieve the server session to get authenticated user details
        const session = await getServerSession(authOptions)

        // Check if the user is authenticated
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Find the user by ID from the session, populate the department field, and exclude the password
        const user = await User.findById(session.user.id).populate("department", "name").select("-password")

        // Check if the user exists
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Return the user data
        return NextResponse.json({
            success: true,
            data: user,
        })
    } catch (error: any) {
        // Log any errors that occur
        console.log(error.message)
        // Return an error response
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PUT handler for updating user profile
export async function PUT(request: NextRequest) {
    try {
        // Establish database connection
        await dbConnect()
        // Retrieve the server session to get authenticated user details
        const session = await getServerSession(authOptions)

        // Check if the user is authenticated
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Parse the request body to get update data
        const body = await request.json()
        // Get the user ID from the session
        const userId = session.user.id

        // console.log("Updating user profile for ID:", userId)
        // console.log("Update data:", body)

        // Destructure the body to exclude sensitive fields that should not be updated via this endpoint
        const { password, role, isActive, ...updateData } = body

        // Find the user by ID and update their information
        // { new: true } returns the updated document
        // { runValidators: true } ensures that schema validations are run
        const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
            new: true,
            runValidators: true,
        })
            .populate("department", "name") // Populate the department field
            .select("-password") // Exclude the password from the returned user object

        // Check if the user was found and updated
        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Return the updated user data
        return NextResponse.json({
            success: true,
            data: updatedUser,
        })
    } catch (error: any) {
        // Return an error response if any error occurs
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
