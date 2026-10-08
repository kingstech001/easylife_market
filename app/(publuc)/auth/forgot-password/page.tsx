"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, Loader2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const inputClass =
  "h-11 rounded-lg border-border bg-background px-3.5 text-base shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-[#0E5A43] focus-visible:ring-4 focus-visible:ring-[#0E5A43]/10 focus-visible:ring-offset-0 sm:text-sm";

const primaryBtn =
  "inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#0E5A43] text-sm font-semibold text-white transition-colors hover:bg-[#083B2D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E5A43]/25 disabled:cursor-not-allowed disabled:opacity-70";

const secondaryBtn =
  "inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E5A43]/15 disabled:cursor-not-allowed disabled:opacity-60";

const highlights = [
  "The link expires after one hour",
  "Sent only to the email on your account",
  "Secure and private",
];

const RESEND_SECONDS = 30;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Count down the resend timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  // Returns true when the reset email was sent
  async function requestReset(): Promise<boolean> {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        setCooldown(RESEND_SECONDS);
        return true;
      }
      toast.error(data.message || "Failed to send reset email");
      return false;
    } catch {
      toast.error("Something went wrong. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (await requestReset()) {
      setEmailSent(true);
      toast.success("Password reset email sent");
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isLoading) return;
    if (await requestReset()) toast.success("We've sent it again");
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* ── Brand panel (desktop) ───────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-[#0E5A43] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(0,0,0,0.25),_transparent_45%)]" />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: "url('/pattern.svg')",
              backgroundRepeat: "repeat",
              backgroundSize: "480px 480px",
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
            {emailSent ? "Check your inbox." : "Reset your password."}
          </h2>
          <p className="mt-4 text-base leading-7 text-white/75">
            {emailSent
              ? "We've sent a secure link. Follow it to choose a new password."
              : "Enter your email and we'll send a secure link to get you back into your account."}
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

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <main className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            aria-label="EasyLife home"
            className="inline-flex items-center lg:hidden"
          >
            <Image src="/logo.png" alt="EasyLife" width={40} height={40} priority />
          </Link>
          <Link
            href="/auth/login"
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {emailSent ? (
            <div aria-live="polite">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Mail className="h-5 w-5 text-[#0E5A43] dark:text-emerald-400" />
              </div>

              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Check your email
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                We sent a password reset link to{" "}
                <span className="break-all font-medium text-foreground">{email}</span>.
                It expires in one hour.
              </p>

              <ul className="mt-6 space-y-2 border-l-2 border-border pl-4 text-sm text-muted-foreground">
                <li>Check your spam or junk folder</li>
                <li>Make sure the email address is correct</li>
                <li>Give it a few minutes to arrive</li>
              </ul>

              <div className="mt-8 space-y-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isLoading}
                  className={secondaryBtn}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : cooldown > 0 ? (
                    `Resend email in ${cooldown}s`
                  ) : (
                    "Resend email"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                    setCooldown(0);
                  }}
                  className="inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium text-[#0E5A43] transition-colors hover:underline dark:text-emerald-400"
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Forgot your password?
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  No problem. Enter your email and we&apos;ll send you a link to
                  reset it.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className={inputClass}
                    required
                  />
                </div>

                <button type="submit" disabled={isLoading} className={primaryBtn}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-[#0E5A43] hover:underline dark:text-emerald-400"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}