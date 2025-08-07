import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      },
    })
  } catch (error) {
    console.error("Token verification failed:", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}
