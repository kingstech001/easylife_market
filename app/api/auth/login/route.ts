import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    console.log("=== LOGIN DEBUG ===");
    console.log("1. Login attempt for:", email);
    console.log("2. Password provided length:", password?.length);

    await connectToDB();

    // ✅ CRITICAL FIX: Always explicitly select password even without select: false
    // This ensures password is included regardless of model configuration
    const user = await User.findOne({ email }).select('+password');
    
    console.log("3. User found:", !!user);
    
    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    console.log("4. User ID:", user._id);
    console.log("5. User email:", user.email);
    console.log("6. Password field exists:", !!user.password);
    console.log("7. Password hash preview:", user.password?.substring(0, 30) + "...");
    console.log("8. Password hash length:", user.password?.length);
    console.log("9. Is bcrypt hash:", /^\$2[aby]\$/.test(user.password || ""));

    // Ensure password exists
    if (!user.password) {
      console.log("❌ No password set for user");
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    console.log("10. Comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("11. Password match result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password mismatch");
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("✅ Password validated successfully");

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    console.log("✅ Login successful, token set");

    return response;
  } catch (error) {
    console.error("❌ Login error:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}