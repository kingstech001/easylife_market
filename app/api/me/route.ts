// app/api/me/route.ts
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { connectToDB } from "@/lib/db"
import User from "@/models/User"

// Helper: Verify JWT
async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const { payload } = await jwtVerify(token, secret)
  return payload
}

// ================== GET /api/me ==================
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  try {
    // ✅ Verify token and extract payload
    const payload = await verifyToken(token)

    if (!payload?.id) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // ✅ Connect to DB
    await connectToDB()

    // ✅ Fetch user from DB (only safe fields)
    const user = await User.findById(payload.id).select(
      "_id firstName lastName email role"
    )

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 })
    }

    return NextResponse.json({ user }, { status: 200 })
  } catch (err) {
    console.error("❌ /api/me error:", err)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
