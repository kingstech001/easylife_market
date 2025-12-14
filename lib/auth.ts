import { cookies } from "next/headers"
import { jwtVerify } from "jose"

export interface UserPayload {
  id: string
  email: string
  role: string
}

/**
 * Extracts authenticated user from JWT cookie
 * Safe for API routes, server components, and webhooks
 */
export async function getUserFromCookies(): Promise<UserPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) return null
    if (!process.env.JWT_SECRET) return null

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
  } catch (error) {
    console.error("Auth: Invalid or expired JWT", error)
    return null
  }
}

/**
 * Role-based access helper
 */
export async function requireUserRole(
  requiredRole: string
): Promise<UserPayload | null> {
  const user = await getUserFromCookies()
  if (!user || user.role !== requiredRole) return null
  return user
}
