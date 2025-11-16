import { NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import User from "@/models/User"
import crypto from "crypto"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest) {
  try {
    await connectToDB

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, you will receive a reset email" },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex")

    // Set token and expiry (1 hour)
    user.resetPasswordToken = resetTokenHash
    user.resetPasswordExpires = new Date(Date.now() + 3600000) // 1 hour
    await user.save()

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const mailOptions = {
      from: `"EasyLife" <${process.env.SMTP_FROM}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #c0a146 0%, #d4b55e 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">EasyLife</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">Reset Your Password</h2>
                        <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">
                          Hi ${user.firstName || "there"},
                        </p>
                        <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">
                          We received a request to reset your password. Click the button below to create a new password:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #c0a146 0%, #d4b55e 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                            Reset Password
                          </a>
                        </div>
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; line-height: 1.6;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0 0 20px 0; color: #c0a146; font-size: 14px; word-break: break-all;">
                          ${resetUrl}
                        </p>
                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                          <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                            <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
                          </p>
                        </div>
                        <p style="margin: 20px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                          If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                          Need help? Contact us at <a href="mailto:easylifemarket01@gmail.com" style="color: #c0a146; text-decoration: none;">easylifemarket01@gmail.com</a>
                        </p>
                        <p style="margin: 0; color: #999; font-size: 12px;">
                          © ${new Date().getFullYear()} EasyLife. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json(
      { message: "Password reset email sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { message: "Failed to process request" },
      { status: 500 }
    )
  }
}
