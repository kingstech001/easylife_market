import { NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import User from "@/models/User"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    await connectToDB()

    const { email, code, resend } = await req.json()

    console.log("Verification request:", { email, code: code ? "***" : undefined, resend })

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    // Find user with multiple fallback methods
    let user = await User.findOne({ email: email.toLowerCase().trim() })

    if (!user) {
      // Try case-insensitive search
      user = await User.findOne({
        email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      })
    }

    if (!user) {
      console.log("❌ User not found")
      return NextResponse.json(
        { message: "User not found. Please check your email or register first." },
        { status: 404 }
      )
    }

    console.log("✅ User found:", {
      id: user._id,
      email: user.email,
      isVerified: user.isVerified,
      hasToken: !!user.verificationToken,
      tokenExpires: user.verificationTokenExpires,
    })

    // Handle resend request
    if (resend) {
      if (user.isVerified) {
        return NextResponse.json({ message: "Email already verified." }, { status: 400 })
      }

      // Generate new code
      const newCode = Math.floor(100000 + Math.random() * 900000).toString()
      const codeExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Update user with new code
      user.verificationToken = newCode
      user.verificationTokenExpires = codeExpires
      await user.save()

      console.log("📝 New verification code generated:", { code: newCode, expires: codeExpires })

      // Send email
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
          subject: "Your New Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #c0a146 0%, #d4b55e 100%); border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Easylife Market</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Your New Verification Code</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.5;">
                  Hello ${user.firstName},
                </p>
                <p style="color: #666; font-size: 16px; line-height: 1.5;">
                  You requested a new verification code. Here it is:
                </p>
                
                <div style="background-color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 30px 0; border: 2px dashed #c0a146; border-radius: 8px; color: #c0a146;">
                  ${newCode}
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.5;">
                  This code will expire in <strong>10 minutes</strong>.
                </p>
                <p style="color: #999; font-size: 12px; line-height: 1.5; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  If you didn't request this code, please ignore this email or contact support if you have concerns.
                </p>
              </div>
            </div>
          `,
          text: `Hello ${user.firstName},\n\nYour new verification code is: ${newCode}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
        })

        console.log("✅ Verification email sent to:", email)
      } catch (emailError: any) {
        console.error("❌ Failed to send email:", emailError)
        return NextResponse.json(
          { message: "Failed to send verification email. Please try again." },
          { status: 500 }
        )
      }

      return NextResponse.json({ message: "New code sent to your email." }, { status: 200 })
    }

    // Verify code
    if (!code) {
      return NextResponse.json({ message: "Verification code is required" }, { status: 400 })
    }

    // Check if user already verified
    if (user.isVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 400 })
    }

    console.log("🔍 Verifying code:", {
      stored: user.verificationToken,
      provided: code,
      expires: user.verificationTokenExpires,
    })

    // Check if verification code exists
    if (!user.verificationToken) {
      return NextResponse.json(
        { message: "No verification code found. Please request a new code by clicking 'Resend Code'." },
        { status: 400 }
      )
    }

    // Check if code expired
    if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
      return NextResponse.json(
        { message: "Verification code has expired. Please request a new code." },
        { status: 400 }
      )
    }

    // Verify code
    if (user.verificationToken !== code.trim()) {
      console.log("❌ Code mismatch:", { 
        stored: user.verificationToken, 
        provided: code.trim() 
      })
      return NextResponse.json({ message: "Invalid verification code" }, { status: 400 })
    }

    // Mark user as verified and clear verification fields
    user.isVerified = true
    user.verificationToken = undefined
    user.verificationTokenExpires = undefined
    await user.save()

    console.log("✅ User verified successfully:", user.email)

    return NextResponse.json({ 
      message: "Email verified successfully! You can now log in." 
    }, { status: 200 })
    
  } catch (error: any) {
    console.error("❌ Verification error:", error)
    return NextResponse.json(
      { message: "Server error occurred during verification" },
      { status: 500 }
    )
  }
}