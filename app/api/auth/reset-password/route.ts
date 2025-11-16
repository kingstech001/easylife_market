import { NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import User from "@/models/User"
import crypto from "crypto"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    await connectToDB()

    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    // ✅ FIX: Use .select('+password') to include the password field
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password +resetPasswordToken +resetPasswordExpires')

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password and clear reset token fields
    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    
    // ✅ Save the user - now the password field is included
    await user.save()

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { message: "Failed to reset password" },
      { status: 500 }
    )
  }
}

// Verify token endpoint
export async function GET(req: NextRequest) {
  try {
    await connectToDB()

    const token = req.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      )
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")

    // ✅ FIX: Select the reset token fields
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires')

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired token", valid: false },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "Token is valid", valid: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Verify token error:", error)
    return NextResponse.json(
      { message: "Failed to verify token", valid: false },
      { status: 500 }
    )
  }
}