import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectToDB } from "@/lib/db";
import nodemailer from "nodemailer";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

// Rate limiter: 5 requests per 15 minutes per IP
const ratelimit = process.env.UPSTASH_REDIS_REST_URL
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "15 m"),
    })
  : null;

export async function POST(req: NextRequest) {
  // Apply rate limiting if Redis is configured
  if (ratelimit) {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { message: "Too many requests, try again later." },
        { status: 429 },
      );
    }
  }

  try {
    const body = await req.json();
    const { firstName, lastName, email, password, role } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 },
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    await connectToDB();

    // Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 400 },
      );
    }

    // Hash password with higher salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate secure verification code
    const verificationToken = crypto.randomInt(100000, 999999).toString();
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with CORRECT field names
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      verificationToken,
      verificationTokenExpires,
      isVerified: false,
      createdAt: new Date(),
    };

    // Avoid logging sensitive data in production
    console.log("Creating user:", {
      email: normalizedEmail,
      hasToken: !!verificationToken,
    });

    const user = await User.create(userData);

    // Send verification email with secure SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true", // Force TLS
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const mailOptions = {
        from: `"Easylife Market" <${process.env.SMTP_FROM}>`,
        to: normalizedEmail,
        subject: "Verify your email - Easylife Market",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${baseUrl}/logo.png" alt="EasyLife" width="120" style="display: block; margin: 0 auto;">
              <h1 style="color: #333; margin-bottom: 10px;">Welcome to Easylife Market!</h1>
              <p style="color: #666; font-size: 16px;">Thank you for registering, ${firstName}!</p>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
              <h2 style="color: #333; margin-bottom: 15px;">Your Verification Code</h2>
              <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 2px dashed #c0a146; margin: 15px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #c0a146;">${verificationToken}</span>
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
        text: `Welcome to Easylife Market, ${firstName}! Your verification code is ${verificationToken}. This code will expire in 10 minutes. If you didn't create an account with us, please ignore this email.`,
      };

      await transporter.sendMail(mailOptions);
      console.log("Verification email sent to:", normalizedEmail);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);

      // Delete the user if email sending fails
      await User.findByIdAndDelete(user._id);

      return NextResponse.json(
        { message: "Failed to send verification email. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message:
          "Registration successful! Please check your email for verification code.",
        email: normalizedEmail,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Server error occurred during registration" },
      { status: 500 },
    );
  }
}
