import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import User from "@/models/User"

// GET doctors by department/specialty
export async function GET(request: NextRequest) {
    try {
        await dbConnect()
        const { searchParams } = new URL(request.url)
        const department = searchParams.get("department")

        const query: any = { role: "doctor", isActive: true }


        const doctors = await User.find(query)
            .select("firstName lastName email specialization department")
            .populate("department", "name")
            .sort({ firstName: 1 })

        return NextResponse.json({
            success: true,
            data: doctors,
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
