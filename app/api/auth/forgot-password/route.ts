import { NextRequest, NextResponse } from "next/server"
import { connectToDB } from "@/lib/db"
import User from "@/models/User"
import crypto from "crypto"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest) {
  try {
    await connectToDB()

    const { email } = await req.json()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      )
    }

    // ✅ FIX: Select reset token fields so we can update them
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+resetPasswordToken +resetPasswordExpires')

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, you will receive a reset email" },
        { status: 200 }
      )
    }

    // Generate reset token - using base64url for URL safety
    const resetToken = crypto.randomBytes(32).toString("base64url")
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
      subject: "Password Reset Request - EasyLife",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Request</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #dddddd;">
                    
                    <!-- Header with Logo -->
                    <tr>
                      <td style="background-color: #e1a200; padding: 30px 40px; border-bottom: 3px solid #c0a146;">
                        <img src="${baseUrl}/logo.png" alt="EasyLife" width="120" style="display: block; margin: 0 auto;">
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px 40px 30px 40px;">
                        <h2 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px; font-weight: normal;">
                          Password Reset Request
                        </h2>
                        
                        <p style="margin: 0 0 16px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                          Dear ${user.firstName || "Valued Customer"},
                        </p>
                        
                        <p style="margin: 0 0 16px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                          We received a request to reset the password for your EasyLife account. To proceed with the password reset, please click the button below:
                        </p>
                        
                        <!-- Reset Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background-color: #c0a146; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: normal; border: none;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 16px 0; color: #555555; font-size: 14px; line-height: 1.6;">
                          Alternatively, you may copy and paste the following link into your browser:
                        </p>
                        
                        <p style="margin: 0 0 20px 0; padding: 12px; background-color: #f9f9f9; border: 1px solid #e0e0e0; color: #c0a146; font-size: 13px; word-break: break-all; font-family: monospace;">
                          ${resetUrl}
                        </p>
                        
                        <!-- Important Notice -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; border: 1px solid #e0e0e0; background-color: #fafafa;">
                          <tr>
                            <td style="padding: 16px;">
                              <p style="margin: 0 0 8px 0; color: #2c3e50; font-size: 14px; font-weight: bold;">
                                Important Information:
                              </p>
                              <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 13px; line-height: 1.6;">
                                <li style="margin-bottom: 6px;">This link will expire in <strong>1 hour</strong> for security purposes.</li>
                                <li style="margin-bottom: 6px;">If you did not request this password reset, please disregard this email.</li>
                                <li>Your password will remain unchanged unless you complete the reset process.</li>
                              </ul>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0 0 0; color: #555555; font-size: 14px; line-height: 1.6;">
                          If you have any questions or concerns, please contact our support team.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9f9f9; padding: 30px 40px; border-top: 1px solid #e0e0e0;">
                        <p style="margin: 0 0 8px 0; color: #777777; font-size: 13px; text-align: center;">
                          Best regards,<br>
                          <strong>The EasyLife Team</strong>
                        </p>
                        
                        <p style="margin: 16px 0 8px 0; color: #777777; font-size: 12px; text-align: center;">
                          Questions? Contact us at 
                          <a href="mailto:easylifemarket01@gmail.com" style="color: #c0a146; text-decoration: none;">
                            easylifemarket01@gmail.com
                          </a>
                        </p>
                        
                        <p style="margin: 16px 0 0 0; color: #999999; font-size: 11px; text-align: center; line-height: 1.4;">
                          © ${new Date().getFullYear()} EasyLife. All rights reserved.<br>
                          This is an automated message. Please do not reply to this email.
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