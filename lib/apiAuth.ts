import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

export async function getApiUser(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  if (!token || !process.env.JWT_SECRET) return null

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    }
  } catch {
    return null
  }
}

export async function requireApiRole(request: NextRequest, roles: string[]) {
  const user = await getApiUser(request)
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  if (!roles.includes(user.role)) {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return { user, response: null }
}
