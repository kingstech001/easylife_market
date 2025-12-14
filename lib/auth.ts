import { cookies } from "next/headers"
import { jwtVerify } from "jose"

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

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    // Ensure payload has the expected properties
    if (
      typeof payload.id !== "string" || 
      typeof payload.email !== "string" || 
      typeof payload.role !== "string"
    ) {
      console.log("Auth: Invalid token payload structure")
      return null
    }

    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    } as UserPayload
  } catch (error) {
    console.error("Auth: Error verifying JWT:", error)
    // ❌ REMOVED: Cannot modify response cookies from a utility function
    // The API route calling this function should handle cookie deletion if needed
    return null
  }
}

// Verify user has a specific role
export async function verifyUserRole(requiredRole: string): Promise<UserPayload | null> {
  const user = await getUserFromCookies()
  
  if (!user) {
    console.log(`Auth: No user found when verifying role: ${requiredRole}`)
    return null
  }
  
  if (user.role !== requiredRole) {
    console.log(`Auth: User role mismatch. Required: ${requiredRole}, Got: ${user.role}`)
    return null
  }
  
  return user
}

// Helper to check if user is authenticated (any role)
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUserFromCookies()
  return user !== null
}

// Helper to get user or throw error (useful for protected routes)
export async function requireAuth(): Promise<UserPayload> {
  const user = await getUserFromCookies()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

// Helper to require specific role or throw error
export async function requireRole(requiredRole: string): Promise<UserPayload> {
  const user = await verifyUserRole(requiredRole)
  if (!user) {
    throw new Error(`Role '${requiredRole}' required`)
  }
  return user
}