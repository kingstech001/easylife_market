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

    const user = await User.findOne({ email });
    
    console.log("3. User found:", !!user);
    
    if (!user) {
      console.log("❌ User not found");
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log("4. User ID:", user._id);
    console.log("5. User email:", user.email);
    console.log("6. Password field exists:", !!user.password);
    console.log("7. Password hash preview:", user.password?.substring(0, 30) + "...");
    console.log("8. Password hash length:", user.password?.length);
    console.log("9. Is bcrypt hash (starts with $2a$ or $2b$):", 
      user.password?.startsWith("$2a$") || user.password?.startsWith("$2b$"));
    
    // Check if resetPasswordToken fields exist (should be cleared after reset)
    console.log("10. Reset token exists:", !!user.resetPasswordToken);
    console.log("11. Reset expiry exists:", !!user.resetPasswordExpires);

    console.log("12. Comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("13. Password match result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password mismatch");
      
      // Additional debugging
      console.log("14. Testing if password stored as plain text (security issue):");
      console.log("    Plain text match:", password === user.password);
      
      // Test if we can hash the provided password and see what we get
      const testHash = await bcrypt.hash(password, 10);
      console.log("15. Test hash of provided password:", testHash.substring(0, 30) + "...");
      
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