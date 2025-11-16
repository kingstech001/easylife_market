import { NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import User from "@/models/User"
import crypto from "crypto"

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

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "Token is valid" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Verify token error:", error)
    return NextResponse.json(
      { message: "Failed to verify token" },
      { status: 500 }
    )
  }
}