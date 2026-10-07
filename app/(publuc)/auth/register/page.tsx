"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  ShoppingBag,
  Store,
} from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters." }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .refine((val) => /[a-z]/.test(val), {
        message: "Password must contain at least one lowercase letter.",
      })
      .refine((val) => /[A-Z]/.test(val), {
        message: "Password must contain at least one uppercase letter.",
      })
      .refine((val) => /\d/.test(val), {
        message: "Password must contain at least one number.",
      })
      .refine((val) => /[^\w\s]/.test(val), {
        message: "Password must contain at least one special character.",
      }),
    confirmPassword: z.string(),
    role: z.enum(["buyer", "seller"], {
      message: "Please select a role.",
    }),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Accept the terms and conditions to continue.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const inputClass =
  "h-11 rounded-lg border-border bg-background px-3.5 text-base shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-[#0E5A43] focus-visible:ring-4 focus-visible:ring-[#0E5A43]/10 focus-visible:ring-offset-0 sm:text-sm";

const passwordRules = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "Uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "Number", test: (v: string) => /\d/.test(v) },
  { label: "Special character", test: (v: string) => /[^\w\s]/.test(v) },
];

const highlights = [
  "Open a store and list your products",
  "Discover trusted stores and save favourites",
  "Secure email verification",
];

const roleOptions = [
  {
    value: "seller" as const,
    label: "Seller",
    hint: "Open a store and sell",
    icon: Store,
  },
  {
    value: "buyer" as const,
    label: "Buyer",
    hint: "Shop from stores",
    icon: ShoppingBag,
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "seller",
      acceptTerms: false,
    },
  });

  const passwordValue = form.watch("password") ?? "";

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error(response.message || "Something went wrong.");
        return;
      }

      toast.success("Registration successful", {
        description: "Please check your email for verification code.",
      });

      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch {
      toast.error("An error occurred while registering.", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* ── Brand panel (desktop, stays in view while the form scrolls) ──── */}
      <aside className="relative hidden overflow-hidden bg-[#0E5A43] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:self-start lg:p-12">
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
            Join EasyLife.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/75">
            Create an account to shop from trusted stores, or open your own
            and start selling.
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

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              It only takes a minute. We&apos;ll email you a code to verify it.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              {/* Name */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium">
                        First name
                      </FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="given-name"
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium">
                        Last name
                      </FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="family-name"
                          disabled={isLoading}
                          className={inputClass}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email */}
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
                        disabled={isLoading}
                        className={inputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
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

                    {/* Live requirements */}
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1.5">
                      {passwordRules.map((rule) => {
                        const met = rule.test(passwordValue);
                        return (
                          <li
                            key={rule.label}
                            className={cn(
                              "flex items-center gap-1.5 text-xs transition-colors",
                              met
                                ? "text-[#0E5A43] dark:text-emerald-400"
                                : "text-muted-foreground",
                            )}
                          >
                            {met ? (
                              <Check className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                                <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                              </span>
                            )}
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium">
                      Confirm password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          disabled={isLoading}
                          className={`${inputClass} pr-11`}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          disabled={isLoading}
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          aria-pressed={showConfirmPassword}
                          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A43]/40"
                        >
                          {showConfirmPassword ? (
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

              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium">
                      I want to join as
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-3"
                        disabled={isLoading}
                      >
                        {roleOptions.map(({ value, label, hint, icon: Icon }) => (
                          <label
                            key={value}
                            htmlFor={value}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors",
                              field.value === value
                                ? "border-[#0E5A43] bg-[#0E5A43]/5 ring-1 ring-[#0E5A43]"
                                : "border-border hover:border-foreground/30",
                              isLoading && "cursor-not-allowed opacity-60",
                            )}
                          >
                            <RadioGroupItem
                              value={value}
                              id={value}
                              className="mt-0.5 data-[state=checked]:border-[#0E5A43] data-[state=checked]:text-[#0E5A43]"
                            />
                            <span className="min-w-0">
                              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                <Icon
                                  className="h-4 w-4 text-muted-foreground"
                                  strokeWidth={1.75}
                                />
                                {label}
                              </span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {hint}
                              </span>
                            </span>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Terms */}
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="flex items-start gap-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                          className="mt-0.5 data-[state=checked]:border-[#0E5A43] data-[state=checked]:bg-[#0E5A43]"
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer text-sm font-normal leading-5 text-muted-foreground">
                        I agree to the{" "}
                        <Link
                          href="/terms"
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-foreground underline underline-offset-2 hover:text-[#0E5A43]"
                        >
                          Terms and Conditions
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="/privacy"
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-foreground underline underline-offset-2 hover:text-[#0E5A43]"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#0E5A43] text-sm font-semibold text-white transition-colors hover:bg-[#083B2D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E5A43]/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>
          </Form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-[#0E5A43] hover:underline dark:text-emerald-400"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}