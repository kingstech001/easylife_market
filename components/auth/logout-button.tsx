"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  children?: React.ReactNode
}

export function LogoutButton({ variant = "ghost", size = "icon", children }: LogoutButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      if (typeof window !== "undefined") {
        // Clear local storage
        localStorage.removeItem("authenticated")
        localStorage.removeItem("user")

        // Clear authentication cookie
        document.cookie = "authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      }

      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      })

      // Redirect to home page
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)

      toast({
        title: "Error",
        description: "An error occurred while logging out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleLogout} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {!children && <LogOut className="h-4 w-4" />}
          {children}
        </>
      )}
      {!children && <span className="sr-only">Log out</span>}
    </Button>
  )
}
