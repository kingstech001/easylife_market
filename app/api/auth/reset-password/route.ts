import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { connectToDB } from "@/lib/db"
import User from "@/models/User"

export async function POST(req: NextRequest) {
  try {
    await connectToDB()

    const { token, newPassword } = await req.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: "Token and new password are required" },
        { status: 400 },
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 },
      )
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password +resetPasswordToken +resetPasswordExpires")

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 },
      )
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined

    await user.save()

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { message: "Failed to reset password. Please try again." },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDB()

    const token = req.nextUrl.searchParams.get("token")
    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 },
      )
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired token", valid: false },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { message: "Token is valid", valid: true },
      { status: 200 },
    )
  } catch (error) {
    console.error("Verify token error:", error)
    return NextResponse.json(
      { message: "Failed to verify token", valid: false },
      { status: 500 },
    )
  }
}
