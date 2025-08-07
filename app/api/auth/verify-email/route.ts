import { NextResponse } from "next/server"
import User from "@/models/User"
import { connectToDB } from "@/lib/db"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, code, resend } = body

    // Debug logging
    console.log("Verification request received:", { email, code: code ? "***" : undefined, resend })

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    await connectToDB()

    // Try multiple search methods to debug the issue
    console.log("Searching for user with email:", email)

    // First, try exact match
    let user = await User.findOne({ email: email })
    console.log("Exact match result:", user ? "Found" : "Not found")

    // If not found, try case-insensitive search
    if (!user) {
      user = await User.findOne({
        email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      })
      console.log("Case-insensitive match result:", user ? "Found" : "Not found")
    }

    // If still not found, try trimmed version
    if (!user) {
      const trimmedEmail = email.trim().toLowerCase()
      user = await User.findOne({ email: trimmedEmail })
      console.log("Trimmed lowercase match result:", user ? "Found" : "Not found")
    }

    // Debug: List all users to see what's in the database (remove in production)
    const allUsers = await User.find({}, { email: 1, _id: 1 }).limit(10)
    console.log(
      "Sample users in database:",
      allUsers.map((u) => ({ id: u._id, email: u.email })),
    )

    if (!user) {
      console.log("User not found after all search attempts")
      return NextResponse.json(
        {
          message: "User not found. Please check your email address or register first.",
        },
        { status: 404 },
      )
    }

    console.log("User found:", { id: user._id, email: user.email, verified: user.verified })

    // Handle resend logic
    if (resend) {
      if (user.verified) {
        return NextResponse.json({ message: "Email already verified." }, { status: 400 })
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString()
      user.verificationCode = newCode
      user.codeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 min expiry
      await user.save()

      console.log("New verification code generated for user:", user.email)

      // Resend email
      try {
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        })

        await transporter.sendMail({
          from: `"Easylife Market" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Your new verification code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Your New Verification Code</h2>
              <p>Your new verification code is:</p>
              <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                ${newCode}
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
          `,
          text: `Your new verification code is ${newCode}. It will expire in 10 minutes.`,
        })

        console.log("Verification email sent successfully to:", email)
      } catch (emailError: any) {
        console.error("Failed to send verification email:", emailError)
        return NextResponse.json({ message: "Failed to send verification email. Please try again." }, { status: 500 })
      }

      return NextResponse.json({ message: "New code sent to your email." }, { status: 200 })
    }

    // Verification logic
    if (!code) {
      return NextResponse.json({ message: "Verification code is required" }, { status: 400 })
    }

    console.log("Verifying code for user:", user.email)
    console.log("Stored code:", user.verificationCode)
    console.log("Provided code:", code)
    console.log("Code expires:", user.codeExpires)

    if (user.verificationCode !== code) {
      return NextResponse.json({ message: "Invalid verification code" }, { status: 400 })
    }

    if (user.codeExpires && user.codeExpires < new Date()) {
      return NextResponse.json({ message: "Verification code has expired" }, { status: 400 })
    }

    // Mark as verified
    user.verified = true
    user.verificationCode = undefined
    user.codeExpires = undefined
    await user.save()

    console.log("User verified successfully:", user.email)

    return NextResponse.json({ message: "Email verified successfully!" }, { status: 200 })
  } catch (error: any) {
    console.error("Verification error:", error)
    return NextResponse.json(
      {
        message: "Server error occurred during verification",
      },
      { status: 500 },
    )
  }
}
