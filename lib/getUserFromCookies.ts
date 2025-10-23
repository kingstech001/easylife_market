import { jwtVerify } from "jose"
import type { NextRequest } from "next/server"

// Define the structure of the user payload you expect from the JWT
interface UserPayload {
  id: string
  role?: string
  email?: string
  // Add any other properties you store in your JWT payload (e.g., role, email)
}

/**
 * Retrieves and verifies the user's authentication token from cookies.
 * @param request The NextRequest object from the API route.
 * @returns A Promise that resolves to the user payload if authenticated, otherwise null.
 */
export default async function getUserFromCookies(request: NextRequest): Promise<UserPayload | null> {
  try {
    // token from cookie or fallback to Authorization header
    const cookieToken = request.cookies.get("token")?.value
    const authHeader = request.headers.get("authorization")
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined
    const token = cookieToken || bearerToken

    if (!token) {
      if (process.env.NODE_ENV !== "production") console.debug("No token found in cookies/authorization.")
      return null
    }

    if (!process.env.JWT_SECRET) {
      if (process.env.NODE_ENV !== "production") console.error("JWT_SECRET environment variable is not set.")
      return null
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    // Verify the JWT token (throws if invalid/expired)
    const { payload } = await jwtVerify(token, secret)

    const p: any = payload as any

    if (!p?.id || typeof p.id !== "string") {
      if (process.env.NODE_ENV !== "production") console.error("Invalid JWT payload: 'id' is missing or not a string.")
      return null
    }

    // return useful fields
    return {
      id: p.id,
      role: typeof p.role === "string" ? p.role : undefined,
      email: typeof p.email === "string" ? p.email : undefined,
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("Error verifying JWT or getting user from cookies:", error)
    return null
  }
}
