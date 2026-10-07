"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const inputClass =
  "h-11 rounded-lg border-border bg-background px-3.5 text-base shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-[#0E5A43] focus-visible:ring-4 focus-visible:ring-[#0E5A43]/10 focus-visible:ring-offset-0 sm:text-sm";

const highlights = [
  "Track your orders and saved items",
  "Manage your store, products and sales",
  "Secure, private sign-in",
];

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
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* ── Brand panel (desktop) ───────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-[#0E5A43] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(0,0,0,0.25),_transparent_45%)]" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "url('/icon.png')",
              backgroundRepeat: "repeat",
              backgroundSize: "400px 400px",
              backgroundPosition: "center",
            }}
          />
        </div>

        <Link
          href="/"
          aria-label="EasyLife home"
          className="relative inline-flex w-fit items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Image
            src="/logo.png"
            alt="EasyLife"
            width={48}
            height={48}
            priority
            className="drop-shadow-lg"
          />
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-[1.15] tracking-tight">
            Welcome back.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/75">
            Sign in to pick up where you left off, whether you&apos;re
            shopping or running your store.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-white/85">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Check className="h-4 w-4 shrink-0 text-[#f6cf66]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} EasyLife
        </p>
      </aside>

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <main className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="EasyLife home"
            className="inline-flex items-center lg:hidden"
          >
            <Image
              src="/logo.png"
              alt="EasyLife"
              width={40}
              height={40}
              priority
            />
          </Link>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your email and password to continue.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        autoFocus
                        disabled={isLoading}
                        className={inputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">
                        Password
                      </FormLabel>
                      <Link
                        href="/auth/forgot-password"
                        tabIndex={isLoading ? -1 : 0}
                        className="text-sm font-medium text-[#0E5A43] transition-colors hover:text-[#083B2D] hover:underline dark:text-emerald-400"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          disabled={isLoading}
                          className={`${inputClass} pr-11`}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          disabled={isLoading}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          aria-pressed={showPassword}
                          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A43]/40"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2">
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
                  className="cursor-pointer select-none text-sm text-foreground/80"
                >
                  Keep me signed in
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#0E5A43] text-sm font-semibold text-white transition-colors hover:bg-[#083B2D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E5A43]/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </Form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            New to EasyLife?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-[#0E5A43] hover:underline dark:text-emerald-400"
            >
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground/80">
            Want to sell? You can open a store right after signing up.
          </p>
        </div>
      </main>
    </div>
  );
}