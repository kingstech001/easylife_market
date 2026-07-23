"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const fieldBaseClass =
  "peer h-14 rounded border-border bg-background px-4 pt-5 text-sm shadow-none transition focus-visible:ring-2 focus-visible:ring-[#0E5A43]/30 focus-visible:ring-offset-0 focus-visible:border-[#0E5A43]/50";

function getSafeRedirectPath() {
  if (typeof window === "undefined") return null;

  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return null;
  }

  return redirect;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, checkSellerStore, checkSellerProducts } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      const res = await login(values.email, values.password);
      const data = await res.json();

      if (!res.ok) {
        toast.error("Login failed", {
          description: data.message || "Invalid email or password.",
        });
        return;
      }

      toast.success("Login successful", {
        description: `Welcome back, ${data.user.firstName || data.user.email}!`,
      });

      if (data.user.role === "admin") {
        router.push("/dashboard/admin");
      } else if (data.user.role === "seller") {
        const hasStore = await checkSellerStore();
        if (!hasStore) {
          router.push("/create-store");
        } else {
          const hasProducts = await checkSellerProducts();
          router.push(hasProducts ? "/dashboard/seller" : "/store-builder");
        }
      } else if (data.user.role === "buyer") {
        router.push(getSafeRedirectPath() || "/stores");
      } else {
        router.push("/");
      }

      router.refresh();
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          <div className="hidden rounded border-0 border-border bg-muted/20 p-8 shadow-none lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded border border-[#0E5A43]/20 bg-[#0E5A43]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#083B2D]">
                Welcome Back
              </div>
              <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-tight text-foreground">
                Sign in and continue your EasyLife journey
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
                Access your buyer or seller account, manage your activity, and
                continue shopping or growing your store with a cleaner, more
                focused experience.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded border border-border bg-background p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-[#0E5A43]/12 text-[#083B2D]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Secure access
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Your account is protected with email verification, private
                      sessions, and role-based access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded border border-border bg-background p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-[#0E5A43]/12 text-[#083B2D]">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Everything in one place
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Jump back into your store dashboard, orders, favorites,
                      and shopping activity without friction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="w-full border-0 border-border shadow-none">
            <CardHeader className="space-y-5 p-5 pb-3 text-center sm:p-7 sm:pb-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded border border-border bg-background shadow-sm">
                <Image
                  src="/logo.png"
                  alt="EasyLife logo"
                  width={64}
                  height={64}
                  priority
                />
              </div>

              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Sign in to your account
                </CardTitle>
                <CardDescription className="mx-auto max-w-md text-sm leading-6 sm:text-base">
                  Welcome back. Enter your details to continue buying, selling,
                  and managing your EasyLife account.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-2 sm:p-7 sm:pt-3">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="relative">
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder=" "
                              {...field}
                              disabled={isLoading}
                              className={cn(fieldBaseClass, "pl-11")}
                            />
                            <FormLabel className="absolute left-11 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0E5A43] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                              Email Address
                            </FormLabel>
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
                      <FormItem className="relative">
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder=" "
                              {...field}
                              disabled={isLoading}
                              className={cn(fieldBaseClass, "pl-11 pr-12")}
                            />
                            <FormLabel className="absolute left-11 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0E5A43] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                              Password
                            </FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded hover:bg-muted"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
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

                  <div className="flex gap-3 sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) =>
                          setRememberMe(checked as boolean)
                        }
                        disabled={isLoading}
                      />
                      <label
                        htmlFor="remember"
                        className="cursor-pointer text-sm font-medium leading-none text-foreground"
                      >
                        Remember me
                      </label>
                    </div>

                    <Link
                      href="/auth/forgot-password"
                      className="text-sm font-medium text-[#083B2D] transition-colors hover:text-[#0E5A43]"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full rounded bg-[#0E5A43] text-sm font-semibold text-white shadow-sm transition hover:bg-[#083B2D]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 p-5 pt-1 sm:p-7 sm:pt-2">
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-[0.16em]">
                  <span className="bg-card px-3 text-muted-foreground">
                    Don&apos;t have an account?
                  </span>
                </div>
              </div>

              <Link href="/auth/register" className="w-full">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded border-border bg-background hover:border-[#0E5A43]/50 hover:bg-[#0E5A43]/[0.05] hover:text-[#083B2D]"
                  disabled={isLoading}
                >
                  Create an Account
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
