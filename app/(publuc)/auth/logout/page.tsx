"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Call your logout API to clear the HTTP-only cookie
    const logout = async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Important to include the cookie
      })

      // Redirect to home page
      router.push("/")
      router.refresh()
    }

    logout()
  }, [router])

  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <h1 className="text-2xl font-bold mb-2">Logging out...</h1>
      <p className="text-muted-foreground">You will be redirected to the home page shortly.</p>
    </div>
  )
}
