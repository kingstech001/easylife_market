import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { NextResponse } from "next/server"

interface UserPayload {
  id: string
  email: string
  role: string
}

export async function getUserFromCookies(): Promise<UserPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      console.log("Auth: No token found in cookies.")
      return null
    }

    if (!process.env.JWT_SECRET) {
      console.error("Auth: JWT_SECRET is not defined.")
      return null
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    // Ensure payload has the expected properties
    if (typeof payload.id !== "string" || typeof payload.email !== "string" || typeof payload.role !== "string") {
      return null
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    } as UserPayload
  } catch (error) {
    console.error("Auth: Error verifying JWT or getting user from cookies:", error)
    // In case of an invalid token, you might want to clear the cookie here
    const response = NextResponse.next()
    response.cookies.delete("token")
    return null
  }
}

// Keeping verifyUserRole for consistency, though it's not directly used in the PUT route
export async function verifyUserRole(requiredRole: string): Promise<UserPayload | null> {
  const user = await getUserFromCookies()
  if (!user || user.role !== requiredRole) {
    return null
  }
  return user
}
