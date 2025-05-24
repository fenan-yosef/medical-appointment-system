import { type NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";
import crypto from "crypto";
// Placeholder for actual email sending function
// import { sendPasswordResetEmail } from "@/lib/email"; 

interface Params {
  id: string;
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    // @ts-ignore
    if (!token || token.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized: Access restricted to admins." }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ message: "Invalid patient ID format." }, { status: 400 });
    }

    const patient = await User.findById(id);

    if (!patient) {
      return NextResponse.json({ message: "Patient not found." }, { status: 404 });
    }

    if (patient.role !== "patient") {
      return NextResponse.json({ message: "User found but is not a patient." }, { status: 400 });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const passwordResetExpires = new Date(Date.now() + 3600000); // Token expires in 1 hour

    patient.resetPasswordToken = passwordResetToken;
    patient.resetPasswordExpires = passwordResetExpires;
    await patient.save();

    // Conceptual: Send email to patient.
    // This URL should point to your frontend password reset page
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // try {
    //   await sendPasswordResetEmail({
    //     to: patient.email,
    //     name: patient.firstName,
    //     resetUrl: resetUrl,
    //   });
    // } catch (emailError) {
    //   console.error("Password reset email sending error:", emailError);
    //   // Don't fail the request if email sending fails, but log it.
    //   // Admin can still communicate the token/URL manually if needed.
    //   // Or, decide if this should be a hard failure.
    // }

    return NextResponse.json(
      { 
        message: "Password reset token generated. Email sending is conceptual.",
        resetTokenForManualSharing: resetToken, // For testing/manual sharing if email fails
        resetUrlForManualSharing: resetUrl, // For testing/manual sharing
      }, 
      { status: 200 }
    );

  } catch (error: any) {
    console.error(`Error triggering password reset for patient ${params.id} (admin):`, error);
    // Clear tokens if error occurs after setting them, before saving? Or rely on expiry.
    // For now, let's assume if save fails, tokens are not persisted.
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
