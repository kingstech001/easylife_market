import { jwtVerify } from "jose"
import type { NextRequest } from "next/server"

// Define the structure of the user payload you expect from the JWT
interface UserPayload {
  id: string
  // Add any other properties you store in your JWT payload (e.g., role, email)
}

/**
 * Retrieves and verifies the user's authentication token from cookies.
 * @param request The NextRequest object from the API route.
 * @returns A Promise that resolves to the user payload if authenticated, otherwise null.
 */
export default async function getUserFromCookies(request: NextRequest): Promise<UserPayload | null> {
  try {
    // Get the authentication token from the cookies
    // Assuming your auth token cookie is named 'token'
    const token = request.cookies.get("token")?.value

    if (!token) {
      console.log("No token found in cookies.")
      return null
    }

    // Ensure your JWT_SECRET environment variable is set
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET environment variable is not set.")
      return null
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)

    // Verify the JWT token
    const { payload } = await jwtVerify(token, secret)

    // Basic validation of the payload
    if (!payload.id || typeof payload.id !== "string") {
      console.error("Invalid JWT payload: 'id' is missing or not a string.")
      return null
    }

    // Return the user payload
    return { id: payload.id }
  } catch (error) {
    console.error("Error verifying JWT or getting user from cookies:", error)
    return null
  }
}
