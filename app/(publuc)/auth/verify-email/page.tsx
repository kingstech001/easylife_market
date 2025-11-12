"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import Link from "next/link"
import { Loader2, ShieldCheck, ArrowRight, Clock, RefreshCw } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const verifySchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  code: z.string().length(6, { message: "Enter the 6-digit code sent to your email." }),
})

type VerifyFormValues = z.infer<typeof verifySchema>

function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes = 600 seconds

  const form = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      email: searchParams.get("email") || "",
      code: "",
    },
  })

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  async function onSubmit(data: VerifyFormValues) {
    if (timeLeft <= 0) {
      toast.error("Code expired", { description: "Please request a new verification code." })
      return
    }

    setIsLoading(true)
    try {
      // Trim and normalize email
      const normalizedData = {
        ...data,
        email: data.email.trim().toLowerCase(),
        code: data.code.trim(),
      }

      console.log("Submitting verification:", { email: normalizedData.email, code: "***" })

      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedData),
      })

      const response = await res.json()

      if (!res.ok) {
        console.error("Verification failed:", response)
        toast.error("Verification failed", {
          description: response.message || "Invalid or expired code.",
        })
        return
      }

      toast.success("Email verified!", { description: "You can now log in." })
      setTimeout(() => router.push("/auth/login"), 1500)
    } catch (err) {
      console.error("Verification error:", err)
      toast.error("Something went wrong", { description: "Please try again later." })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendCode() {
    const email = form.getValues("email")
    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setIsResending(true)
    try {
      // Normalize email
      const normalizedEmail = email.trim().toLowerCase()

      console.log("Requesting resend for:", normalizedEmail)

      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, resend: true }),
      })

      const response = await res.json()

      if (!res.ok) {
        console.error("Resend failed:", response)
        toast.error("Failed to resend code", {
          description: response.message || "Please try again later.",
        })
        return
      }

      toast.success("New code sent!", { description: "Check your email for the new verification code." })
      setTimeLeft(600) // Reset timer to 10 minutes
      form.setValue("code", "") // Clear the code field
    } catch (err) {
      console.error("Resend error:", err)
      toast.error("Something went wrong", { description: "Please try again later." })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 py-8 px-4">
      <div className="flex w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-card/80 backdrop-blur-xl border border-border/50 relative">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl translate-x-16 translate-y-16" />

        <div className="w-full p-8 lg:p-12 flex flex-col justify-center relative z-10">
          <div className="mb-6 text-center space-y-3">
            <ShieldCheck className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Verify Your Email
            </h1>
            <p className="text-muted-foreground text-base">
              Enter the 6-digit code we sent to your email to activate your account.
            </p>
          </div>

          {/* Countdown */}
          <div className="flex justify-center items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {timeLeft > 0 ? (
              <span>Code expires in {formatTime(timeLeft)}</span>
            ) : (
              <span className="text-red-500">Code expired! Request a new one.</span>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@example.com"
                        onChange={(e) => field.onChange(e.target.value.trim().toLowerCase())}
                        className={cn(
                          "h-12 bg-background/50 border-border/50 backdrop-blur-sm transition-all duration-200",
                          "focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background",
                          "hover:border-border hover:bg-background/70",
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123456"
                        maxLength={6}
                        disabled={timeLeft <= 0}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                        className={cn(
                          "h-12 text-center text-lg tracking-widest bg-background/50 border-border/50 backdrop-blur-sm transition-all duration-200",
                          "focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background",
                          "hover:border-border hover:bg-background/70",
                          timeLeft <= 0 && "opacity-50 cursor-not-allowed",
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <Button
                  type="submit"
                  className={cn(
                    "w-full h-12 text-base font-medium transition-all duration-200",
                    "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                    "shadow-lg hover:shadow-xl hover:shadow-primary/25",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                  disabled={isLoading || timeLeft <= 0}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Verify Email</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="w-full h-12 bg-transparent"
                >
                  {isResending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      <span>Resend Code</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function VerifyEmailLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailForm />
    </Suspense>
  )
}