"use client";

import { useEffect, useState, Suspense, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const inputClass =
  "h-11 rounded-lg border-border bg-background px-3.5 text-base shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-[#0E5A43] focus-visible:ring-4 focus-visible:ring-[#0E5A43]/10 focus-visible:ring-offset-0 sm:text-sm";

const primaryBtn =
  "inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#0E5A43] text-sm font-semibold text-white transition-colors hover:bg-[#083B2D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E5A43]/25 disabled:cursor-not-allowed disabled:opacity-70";

const eyeBtn =
  "absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A43]/40";

// Same rules as the sign-up page, so a password that works there works here
const passwordRules = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "Uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "Number", test: (v: string) => /\d/.test(v) },
  { label: "Special character", test: (v: string) => /[^\w\s]/.test(v) },
];

const highlights = [
  "Pick something you don't use anywhere else",
  "Mix letters, numbers and symbols",
  "You can sign in with it right away",
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared layout (also used by the Suspense fallback, so there's no layout jump)
// ─────────────────────────────────────────────────────────────────────────────

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
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
            Choose a new password.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/75">
            You&apos;re almost done. Set a strong password and you&apos;ll be
            back in your account in a moment.
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
          {children}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────────────────────

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Check the link as soon as the page opens
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(
          `/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`,
          { signal: controller.signal },
        );
        setTokenValid(response.ok);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setTokenValid(false);
      }
    })();

    return () => controller.abort();
  }, [token]);

  // Send them to sign in shortly after a successful reset
  useEffect(() => {
    if (!resetSuccess) return;
    const id = window.setTimeout(() => router.push("/auth/login"), 3000);
    return () => window.clearTimeout(id);
  }, [resetSuccess, router]);

  const allRulesMet = passwordRules.every((rule) => rule.test(password));
  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (!allRulesMet) {
      toast.error("Your password doesn't meet all the requirements");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setResetSuccess(true);
        toast.success("Password reset successful");
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Checking the link ──────────────────────────────────────────────────────
  if (tokenValid === null) {
    return (
      <AuthShell>
        <div
          className="flex flex-col items-center gap-3 py-10 text-center"
          aria-live="polite"
        >
          <Loader2 className="h-6 w-6 animate-spin text-[#0E5A43] dark:text-emerald-400" />
          <p className="text-sm text-muted-foreground">Checking your reset link...</p>
        </div>
      </AuthShell>
    );
  }

  // ── Bad or expired link ────────────────────────────────────────────────────
  if (tokenValid === false) {
    return (
      <AuthShell>
        <div>
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            This link has expired
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This password reset link is invalid or has already been used. Reset
            links expire after one hour, so you&apos;ll need to request a new one.
          </p>

          <div className="mt-8 space-y-3">
            <Link href="/auth/forgot-password" className={primaryBtn}>
              Request a new link
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium text-[#0E5A43] hover:underline dark:text-emerald-400"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  if (resetSuccess) {
    return (
      <AuthShell>
        <div aria-live="polite">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#0E5A43] text-white">
            <Check className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Password updated
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your password has been reset. Taking you to sign in...
          </p>

          <Link href="/auth/login" className={cn(primaryBtn, "mt-8")}>
            Sign in now
          </Link>
        </div>
      </AuthShell>
    );
  }

  // ── The form ───────────────────────────────────────────────────────────────
  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* New password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            New password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className={`${inputClass} pr-11`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={isLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className={eyeBtn}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1.5">
            {passwordRules.map((rule) => {
              const met = rule.test(password);
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
        </div>

        {/* Confirm */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm new password
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className={`${inputClass} pr-11`}
              aria-invalid={confirmTouched && !passwordsMatch}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              disabled={isLoading}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              aria-pressed={showConfirmPassword}
              className={eyeBtn}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {confirmTouched && (
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs",
                passwordsMatch
                  ? "text-[#0E5A43] dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
              aria-live="polite"
            >
              {passwordsMatch ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Passwords match
                </>
              ) : (
                "Passwords don't match yet"
              )}
            </p>
          )}
        </div>

        <button type="submit" disabled={isLoading} className={primaryBtn}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting password...
            </>
          ) : (
            "Reset password"
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[#0E5A43] dark:text-emerald-400" />
          </div>
        </AuthShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}