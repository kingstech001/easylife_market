"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "buyer" | "seller" | "admin"
  fallbackUrl?: string
}

export function AuthGuard({ children, requiredRole = "buyer", fallbackUrl = "/auth/login" }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Not authenticated")
        }

        const data = await response.json()

        if (data.user?.role === requiredRole) {
          setIsAuthorized(true)
        } else {
          router.push(fallbackUrl)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push(fallbackUrl)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [requiredRole, fallbackUrl, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verifying access...</span>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
