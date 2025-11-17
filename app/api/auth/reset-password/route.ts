import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const { token, newPassword } = await req.json();

    console.log("=== RESET PASSWORD DEBUG ===");
    console.log("1. Token received (first 20 chars):", token?.substring(0, 20) + "...");
    console.log("2. New password length:", newPassword?.length);

    // Validate input
    if (!token || !newPassword) {
      return NextResponse.json(
        { message: "Token and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Hash the token the same way as forgot-password route
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    console.log("3. Hashed token for lookup:", resetTokenHash.substring(0, 20) + "...");

    // ✅ CRITICAL FIX: Select password field explicitly
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password +resetPasswordToken +resetPasswordExpires');

    console.log("4. User found:", !!user);

    if (!user) {
      console.log("❌ Invalid or expired token");
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    console.log("5. User email:", user.email);
    console.log("6. Token expires:", user.resetPasswordExpires);

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log("7. New password hashed successfully");
    console.log("8. New hash preview:", hashedPassword.substring(0, 30) + "...");

    // Update password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Save the user
    await user.save();

    console.log("9. User saved successfully");

    // Verify the password was saved correctly
    const verifyUser = await User.findById(user._id).select('+password');
    console.log("10. ✅ Password saved:", !!verifyUser?.password);
    console.log("11. ✅ Is bcrypt hash:", /^\$2[aby]\$/.test(verifyUser?.password || ""));

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    return NextResponse.json(
      { message: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}

// Verify token endpoint
export async function GET(req: NextRequest) {
  try {
    await connectToDB();

    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired token", valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Token is valid", valid: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json(
      { message: "Failed to verify token", valid: false },
      { status: 500 }
    );
  }
}