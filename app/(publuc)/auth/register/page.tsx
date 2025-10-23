"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, Store, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const registerSchema = z
  .object({
    firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
    lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    // stronger password rule: min 8, must contain lowercase, uppercase, number and special character
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .refine((val) => /[a-z]/.test(val), { message: "Password must contain at least one lowercase letter." })
      .refine((val) => /[A-Z]/.test(val), { message: "Password must contain at least one uppercase letter." })
      .refine((val) => /\d/.test(val), { message: "Password must contain at least one number." })
      .refine((val) => /[^\w\s]/.test(val), { message: "Password must contain at least one special character." }),
    confirmPassword: z.string(),
    role: z.enum(["buyer", "seller"], {
      required_error: "Please select a role.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "buyer",
    },
  })

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true)

    console.log("Starting registration process:", {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
    })

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const response = await res.json()
      console.log("Registration response:", { status: res.status, response })

      if (!res.ok) {
        console.error("Registration failed:", response)
        toast.error(response.message || "Something went wrong.")
        return
      }

      console.log("Registration successful, redirecting to verification")
      toast.success("Registration successful", {
        description: "Please check your email for verification code.",
      })

      // Redirect to verify email page with email parameter
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`)
    } catch (err) {
      console.error("Registration error:", err)
      toast.error("An error occurred while registering.", {
        description: "Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 py-8 px-4">
      <div className="flex w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl bg-card/80 backdrop-blur-xl border border-border/50 relative">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-x-16 -translate-y-16" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl translate-x-16 translate-y-16" />

        {/* Left side - Image/Branding */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
          <div
            className="w-full h-full bg-[url('/register.png')] bg-no-repeat bg-center bg-cover"
            style={{ filter: "brightness(0.9) contrast(1.1)" }}
          />
          <div className="absolute inset-0 flex flex-col justify-end p-12 text-white">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                <span className="text-lg font-semibold">Join Our Community</span>
              </div>
              <h2 className="text-3xl font-bold leading-tight">Start your journey with us today</h2>
              <p className="text-white/80 text-lg">
                Create your account and unlock a world of possibilities, whether you're a buyer or a seller.
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative z-10">
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-muted-foreground text-base">Join us and start your journey today.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium">First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Your first name"
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium">Last Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Your last name"
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
              </div>

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
                          placeholder="you@example.com"
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
                          placeholder="••••••••"
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

                    {/* Password requirements hint */}
                    <p className="text-xs text-muted-foreground mt-1">
                      Use at least 8 characters including uppercase, lowercase, a number and a special character.
                    </p>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
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
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
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

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">I want to register as a:</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="buyer" id="buyer" className="sr-only" />
                          </FormControl>
                          <FormLabel
                            htmlFor="buyer"
                            className={cn(
                              "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200",
                              field.value === "buyer" && "border-primary ring-2 ring-primary/20",
                            )}
                          >
                            <ShoppingBag className="mb-3 h-6 w-6 text-primary" />
                            <span className="text-sm font-medium">Buyer</span>
                            <span className="text-xs text-muted-foreground text-center mt-1">
                              Discover stores and purchase products
                            </span>
                          </FormLabel>
                        </FormItem>
                        <FormItem>
                          <FormControl>
                            <RadioGroupItem value="seller" id="seller" className="sr-only" />
                          </FormControl>
                          <FormLabel
                            htmlFor="seller"
                            className={cn(
                              "flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200",
                              field.value === "seller" && "border-primary ring-2 ring-primary/20",
                            )}
                          >
                            <Store className="mb-3 h-6 w-6 text-primary" />
                            <span className="text-sm font-medium">Seller</span>
                            <span className="text-xs text-muted-foreground text-center mt-1">
                              Create and manage your own store
                            </span>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Register</span>
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
              <span className="bg-card px-4 text-muted-foreground font-medium">Already have an account?</span>
            </div>
          </div>

          {/* Login link */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary/80 transition-colors font-medium inline-flex items-center gap-1"
              >
                Login here
                <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
