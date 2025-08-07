import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import User from "@/models/User"
import { connectToDB } from "@/lib/db"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstName, lastName, email, password, role } = body

    // Debug logging
    console.log("Registration request received:", {
      firstName,
      lastName,
      email,
      role,
      passwordLength: password ? password.length : 0,
    })

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      console.log("Missing required fields:", {
        firstName: !!firstName,
        lastName: !!lastName,
        email: !!email,
        password: !!password,
        role: !!role,
      })
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase()
    console.log("Normalized email:", normalizedEmail)

    await connectToDB()
    console.log("Database connected successfully")

    // Check for existing user
    console.log("Checking for existing user with email:", normalizedEmail)
    const existingUser = await User.findOne({ email: normalizedEmail })

    if (existingUser) {
      console.log("User already exists:", {
        id: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
        createdAt: existingUser.createdAt,
      })
      return NextResponse.json({ message: "Email already in use" }, { status: 400 })
    }

    console.log("No existing user found, proceeding with registration")

    // Hash password
    console.log("Hashing password...")
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log("Password hashed successfully")

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    console.log("Generated verification code:", verificationCode)

    // Create user
    console.log("Creating new user...")
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      verificationCode,
      codeExpires: new Date(Date.now() + 10 * 60 * 1000), // expires in 10 mins
      verified: false,
      createdAt: new Date(),
    }

    const user = await User.create(userData)
    console.log("User created successfully:", {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      verified: user.verified,
    })

    // Send verification email
    console.log("Preparing to send verification email...")
    try {
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })

      console.log("Email transporter created, sending email to:", normalizedEmail)

      const mailOptions = {
        from: `"Easylife Market" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: "Verify your email - Easylife Market",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; margin-bottom: 10px;">Welcome to Easylife Market!</h1>
              <p style="color: #666; font-size: 16px;">Thank you for registering, ${firstName}!</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <h2 style="color: #333; margin-bottom: 15px;">Your Verification Code</h2>
              <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 2px dashed #007bff; margin: 15px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007bff;">${verificationCode}</span>
              </div>
              <p style="color: #666; margin-top: 15px;">This code will expire in <strong>10 minutes</strong></p>
            </div>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404;">
                <strong>Security Note:</strong> If you didn't create an account with us, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 14px;">
                This email was sent from Easylife Market. Please do not reply to this email.
              </p>
            </div>
          </div>
        `,
        text: `Welcome to Easylife Market, ${firstName}! Your verification code is ${verificationCode}. This code will expire in 10 minutes. If you didn't create an account with us, please ignore this email.`,
      }

      await transporter.sendMail(mailOptions)
      console.log("Verification email sent successfully to:", normalizedEmail)
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError)

      // Delete the user if email sending fails
      try {
        await User.findByIdAndDelete(user._id)
        console.log("User deleted due to email sending failure")
      } catch (deleteError) {
        console.error("Failed to delete user after email error:", deleteError)
      }

      return NextResponse.json({ message: "Failed to send verification email. Please try again." }, { status: 500 })
    }

    console.log("Registration completed successfully for:", normalizedEmail)

    return NextResponse.json(
      {
        message: "Registration successful! Please check your email for verification code.",
        email: normalizedEmail,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    console.error("Error stack:", (error as any).stack)

    return NextResponse.json({ message: "Server error occurred during registration" }, { status: 500 })
  }
}
