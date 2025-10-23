"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"  // ✅ Import useAuth hook

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, checkSellerStore } = useAuth()   // ✅ useAuth hook
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true)
    try {
      // ✅ Call login from context instead of raw fetch
      const res = await login(values.email, values.password)
      const data = await res.json()

      if (!res.ok) {
        toast.error("Login failed", {
          description: data.message || "Invalid email or password.",
        })
        return
      }

      toast.success("Login successful", {
        description: `Welcome back, ${data.user.email}`,
      })

      // Role-based redirects
      if (data.user.role === "admin") {
        router.push("/dashboard/admin")
      } else if (data.user.role === "seller") {
        const hasStore = await checkSellerStore()
        router.push(hasStore ? "/dashboard/seller" : "/create-store")
      } else {
        router.push("/")
      }

      router.refresh()
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex  items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 py-8 px-4">
      <div className="flex w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl bg-card/80 backdrop-blur-xl border border-border/50 relative">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl translate-x-16 translate-y-16" />

        {/* Left side - Image/Branding */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
          <div
            className="w-full h-full bg-[url('/login.png')] bg-no-repeat bg-center bg-cover"
            style={{ filter: "brightness(0.9) contrast(1.1)" }}
          />
          <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                <span className="text-lg font-semibold">Welcome Back</span>
              </div>
              <h2 className="text-3xl font-bold leading-tight">Continue your journey with us</h2>
              <p className="text-white/80 text-lg">Access your account and explore endless possibilities.</p>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative z-10">
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Sign In
            </h1>
            <p className="text-muted-foreground text-base">Enter your credentials to access your account</p>
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
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter your email"
                          {...field}
                          className={cn(
                            "pl-10 h-12 bg-background/50 border-border/50 backdrop-blur-sm transition-all duration-200",
                            "focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background",
                            "hover:border-border hover:bg-background/70",
                          )}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...field}
                          className={cn(
                            "pl-10 pr-10 h-12 bg-background/50 border-border/50 backdrop-blur-sm transition-all duration-200",
                            "focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background",
                            "hover:border-border hover:bg-background/70",
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="rounded border-border text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="remember" className="text-muted-foreground cursor-pointer">
                    Remember me
                  </label>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className={cn(
                  "w-full h-12 text-base font-medium transition-all duration-200",
                  "bg-gradient-to-r from-[#c0a146] to-[#c0a146]/90 hover:from-[#c0a146]/90 hover:to-[#c0a146]",
                  "shadow-lg hover:shadow-xl hover:shadow-[#c0a146]/25",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>
            </form>
          </Form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground font-medium">New to our platform?</span>
            </div>
          </div>

          {/* Sign up link */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="text-primary hover:text-primary/80 transition-colors font-medium inline-flex items-center gap-1"
              >
                Create account
                <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
