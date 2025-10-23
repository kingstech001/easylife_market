"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export default function LogoutPage() {
  const router = useRouter()
  const { logout } = useAuth()

  useEffect(() => {
    // Call your logout API to clear the HTTP-only cookie
    logout().then(() => {
      // Redirect to home page after logout
      router.push("/")
    })

  }, [router])

}
