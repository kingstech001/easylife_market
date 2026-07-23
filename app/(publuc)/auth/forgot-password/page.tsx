"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const fieldBaseClass =
  "peer h-14 rounded border-border bg-background px-4 pt-5 text-sm shadow-none transition focus-visible:ring-2 focus-visible:ring-[#0E5A43]/30 focus-visible:ring-offset-0 focus-visible:border-[#0E5A43]/50";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast.success("Password reset email sent!");
      } else {
        toast.error(data.message || "Failed to send reset email");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
          <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
            <div className="hidden rounded border border-border bg-muted/20 p-8 shadow-sm lg:flex lg:flex-col lg:justify-between">
              <div>
                <div className="inline-flex items-center rounded border border-[#0E5A43]/20 bg-[#0E5A43]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#083B2D]">
                  Recovery sent
                </div>
                <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-tight text-foreground">
                  Check your inbox to continue resetting your password
                </h1>
                <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
                  We&apos;ve sent a secure reset link to your email address. Follow the instructions there to create a new password.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="rounded border border-border bg-background p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded bg-[#0E5A43]/12 text-[#083B2D]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Secure reset link</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        The password reset link is time-limited for security and will expire in one hour.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Card className="w-full rounded border border-border bg-card shadow-sm">
              <CardHeader className="space-y-5 p-5 pb-3 text-center sm:p-7 sm:pb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded border border-border bg-background shadow-sm">
                  <CheckCircle2 className="h-10 w-10 text-[#0E5A43]" />
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Check your email
                  </CardTitle>
                  <CardDescription className="mx-auto max-w-md text-sm leading-6 sm:text-base">
                    We&apos;ve sent a password reset link to <strong>{email}</strong>.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-5 pt-2 sm:p-7 sm:pt-3">
                <p className="text-sm leading-6 text-muted-foreground">
                  Click the link in the email to reset your password. If you don&apos;t see it right away, give it a moment to arrive.
                </p>

                <div className="rounded border border-border bg-muted/25 p-5">
                  <p className="text-sm font-medium text-foreground">Didn&apos;t receive the email?</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    <li>Check your spam or junk folder</li>
                    <li>Confirm you entered the right email address</li>
                    <li>Wait a few minutes and try again</li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3 p-5 pt-1 sm:p-7 sm:pt-2">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded border-border bg-background hover:border-[#0E5A43]/50 hover:bg-[#0E5A43]/[0.05] hover:text-[#083B2D]"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                >
                  Try Another Email
                </Button>

                <Link href="/auth/login" className="w-full">
                  <Button variant="ghost" className="h-12 w-full rounded hover:text-[#083B2D]">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          <div className="hidden rounded border-0 border-border bg-muted/20 p-8 shadow-none lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded border border-[#0E5A43]/20 bg-[#0E5A43]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#083B2D]">
                Account recovery
              </div>
              <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-tight text-foreground">
                Reset your password and get back into your account quickly
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
                Enter your email address and we&apos;ll send you a secure reset link so you can regain access without stress.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded border border-border bg-background p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-[#0E5A43]/12 text-[#083B2D]">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Email recovery</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      We&apos;ll send password reset instructions to the email linked to your EasyLife account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded border border-border bg-background p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-[#0E5A43]/12 text-[#083B2D]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Protected flow</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Reset links are time-limited and designed to keep your account recovery process secure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="w-full rounded border-0 border-border bg-card shadow-none">
            <CardHeader className="space-y-5 p-5 pb-3 text-center sm:p-7 sm:pb-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded border border-border bg-background shadow-sm">
                <Image src="/logo.png" alt="EasyLife logo" width={64} height={64} priority />
              </div>

              <div className="space-y-2">
                <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Forgot your password?
                </CardTitle>
                <CardDescription className="mx-auto max-w-md text-sm leading-6 sm:text-base">
                  No problem. Enter your email and we&apos;ll send instructions to reset your password.
                </CardDescription>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5 p-5 pt-2 sm:p-7 sm:pt-3">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className={cn(fieldBaseClass, "pl-11")}
                    required
                  />
                  <label className="absolute left-11 top-1/2 -translate-y-1/2 text-sm text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-3 peer-focus:text-xs peer-focus:text-[#0E5A43] peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-xs">
                    Email Address
                  </label>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3 p-5 pt-1 sm:p-7 sm:pt-2">
                <Button
                  type="submit"
                  className="h-12 w-full rounded bg-[#0E5A43] text-sm font-semibold text-white shadow-sm transition hover:bg-[#083B2D]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>

                <Link href="/auth/login" className="w-full">
                  <Button
                    variant="ghost"
                    className="h-12 w-full rounded hover:text-[#083B2D]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
