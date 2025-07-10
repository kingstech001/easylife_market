"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear local storage
    localStorage.removeItem("authenticated")
    localStorage.removeItem("user")

    // Clear authentication cookie
    document.cookie = "authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    // Redirect to home page after a short delay
    const timeout = setTimeout(() => {
      router.push("/")
      router.refresh()
    }, 1500)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-10">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <h1 className="text-2xl font-bold mb-2">Logging out...</h1>
      <p className="text-muted-foreground">You will be redirected to the home page shortly.</p>
    </div>
  )
}
