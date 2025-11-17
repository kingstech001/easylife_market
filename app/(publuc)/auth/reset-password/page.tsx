"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  useEffect(() => {
    // Verify token on mount
    if (token) {
      verifyToken()
    } else {
      setTokenValid(false)
    }
  }, [token])

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/auth/verify-reset-token?token=${token}`)
      setTokenValid(response.ok)
    } catch (error) {
      setTokenValid(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword: password }), // ✅ FIXED: Changed from 'password' to 'newPassword'
      })

      const data = await response.json()

      if (response.ok) {
        setResetSuccess(true)
        toast.success("Password reset successful!")
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      } else {
        toast.error(data.message || "Failed to reset password")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-muted/10 to-background p-4">
        <Card className="w-full max-w-md border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#c0a146]" />
              <p className="text-muted-foreground">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-muted/10 to-background p-4">
        <Card className="w-full max-w-md border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Invalid or Expired Link</CardTitle>
              <CardDescription className="text-base">
                This password reset link is invalid or has expired.
              </CardDescription>
            </div>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-3">
            <Link href="/auth/forgot-password" className="w-full">
              <Button className="w-full bg-gradient-to-r from-[#c0a146] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#c0a146]">
                Request New Link
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full">
              <Button variant="ghost" className="w-full hover:text-[#c0a146]">
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-muted/10 to-background p-4">
        <Card className="w-full max-w-md border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#c0a146] to-[#d4b55e] rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl">Password Reset!</CardTitle>
              <CardDescription className="text-base">
                Your password has been successfully reset.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Redirecting you to login page...
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/auth/login" className="w-full">
              <Button className="w-full bg-gradient-to-r from-[#c0a146] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#c0a146]">
                Go to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-muted/10 to-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <div className="w-10 h-10 bg-gradient-to-br from-[#c0a146] to-[#d4b55e] rounded-lg flex items-center justify-center">
              <Lock className="h-5 w-5 text-white" />
            </div>
          </div>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="border-border/50 focus:border-[#c0a146]/50 focus:ring-[#c0a146]/20 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="border-border/50 focus:border-[#c0a146]/50 focus:ring-[#c0a146]/20 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#c0a146] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#c0a146] transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Reset Password
                </>
              )}
            </Button>
            <Link href="/auth/login" className="w-full">
              <Button variant="ghost" className="w-full hover:text-[#c0a146]">
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#c0a146]" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}