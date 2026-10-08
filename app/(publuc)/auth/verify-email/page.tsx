"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Check, Clock, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CODE_LENGTH = 6;
const CODE_LIFETIME_SECONDS = 600; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 30;

const verifySchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  code: z
    .string()
    .length(CODE_LENGTH, { message: "Enter the 6-digit code sent to your email." }),
});

type VerifyFormValues = z.infer<typeof verifySchema>;

const inputClass =
  "h-11 rounded-lg border-border bg-background px-3.5 text-base shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-[#0E5A43] focus-visible:ring-4 focus-visible:ring-[#0E5A43]/10 focus-visible:ring-offset-0 sm:text-sm";

const primaryBtn =
  "inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#0E5A43] text-sm font-semibold text-white transition-colors hover:bg-[#083B2D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E5A43]/25 disabled:cursor-not-allowed disabled:opacity-60";

const highlights = [
  "Enter the 6-digit code from your email",
  "The code expires after 10 minutes",
  "Can't find it? Check your spam folder",
];

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Layout (shared by the form, success state and Suspense fallback)
// ─────────────────────────────────────────────────────────────────────────────

function AuthShell({ children }: { children: React.ReactNode }) {
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
            Verify your email.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/75">
            Confirm your address to activate your account and start shopping or
            selling on EasyLife.
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
// 6-box code input: typing moves forward, backspace moves back, paste and
// SMS/email autofill fill all boxes at once
// ─────────────────────────────────────────────────────────────────────────────

function CodeInput({
  value,
  onChange,
  disabled,
  invalid,
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => value[i] ?? "");

  const focusAt = (i: number) =>
    refs.current[Math.max(0, Math.min(CODE_LENGTH - 1, i))]?.focus();

  const handleChange = (i: number, raw: string) => {
    let typed = raw.replace(/\D/g, "");

    // Typing over a filled box gives two characters: keep the new one
    if (typed.length === 2 && digits[i]) {
      typed = typed.replace(digits[i], "") || typed[1];
    }

    if (typed.length === 0) {
      // Deleted the digit in this box
      onChange(value.slice(0, i) + value.slice(i + 1));
      return;
    }

    if (typed.length === 1) {
      onChange((value.slice(0, i) + typed + value.slice(i + 1)).slice(0, CODE_LENGTH));
      focusAt(i + 1);
      return;
    }

    // Autofill or multi-digit paste into one box
    const next = typed.slice(0, CODE_LENGTH);
    onChange(next);
    focusAt(next.length);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      onChange(value.slice(0, i - 1));
      focusAt(i - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(i + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    focusAt(pasted.length);
  };

  return (
    <div className="grid grid-cols-6 gap-2" role="group" aria-label="Verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => {
            // Keep the cursor on the first empty box, so entry stays in order
            if (i > value.length) focusAt(value.length);
            else e.target.select();
          }}
          className={cn(
            "h-12 w-full min-w-0 rounded-lg border bg-background text-center text-xl font-semibold tabular-nums outline-none transition-colors",
            "focus:border-[#0E5A43] focus:ring-4 focus:ring-[#0E5A43]/10",
            invalid ? "border-red-500" : "border-border",
            disabled && "cursor-not-allowed opacity-50",
          )}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────────────────────

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [editingEmail, setEditingEmail] = useState(!initialEmail);
  const [timeLeft, setTimeLeft] = useState(CODE_LIFETIME_SECONDS);
  const [cooldown, setCooldown] = useState(0);

  const form = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { email: initialEmail, code: "" },
  });

  const email = form.watch("email");
  const expired = timeLeft <= 0;

  // Code expiry countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timeLeft]);

  // Resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  // After verifying, continue to sign in
  useEffect(() => {
    if (!verified) return;
    const id = window.setTimeout(() => router.push("/auth/login"), 2000);
    return () => window.clearTimeout(id);
  }, [verified, router]);

  async function onSubmit(data: VerifyFormValues) {
    if (expired) {
      toast.error("Code expired", {
        description: "Please request a new verification code.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          email: data.email.trim().toLowerCase(),
          code: data.code.trim(),
        }),
      });

      const response = await res.json();

      if (!res.ok) {
        const message = response.message || "Invalid or expired code.";
        form.setError("code", { message });
        toast.error("Verification failed", { description: message });
        return;
      }

      toast.success("Email verified", { description: "You can now sign in." });
      setVerified(true);
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    const address = form.getValues("email").trim().toLowerCase();
    if (!address) {
      toast.error("Please enter your email address");
      setEditingEmail(true);
      return;
    }

    setIsResending(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address, resend: true }),
      });

      const response = await res.json();

      if (!res.ok) {
        toast.error("Failed to resend code", {
          description: response.message || "Please try again later.",
        });
        return;
      }

      toast.success("New code sent", {
        description: "Check your email for the new verification code.",
      });
      setTimeLeft(CODE_LIFETIME_SECONDS);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      form.setValue("code", "");
      form.clearErrors("code");
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsResending(false);
    }
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (verified) {
    return (
      <AuthShell>
        <div aria-live="polite">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#0E5A43] text-white">
            <Check className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Email verified
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your account is ready. Taking you to sign in...
          </p>
          <Link href="/auth/login" className={cn(primaryBtn, "mt-8")}>
            Sign in now
          </Link>
        </div>
      </AuthShell>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Check your email
        </h1>
        {!editingEmail && email ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="break-all font-medium text-foreground">{email}</span>.{" "}
            <button
              type="button"
              onClick={() => setEditingEmail(true)}
              className="font-medium text-[#0E5A43] hover:underline dark:text-emerald-400"
            >
              Wrong email?
            </button>
          </p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter your email and the 6-digit code we sent you.
          </p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {editingEmail && (
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-sm font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus={!initialEmail}
                      disabled={isLoading}
                      onChange={(e) =>
                        field.onChange(e.target.value.trim().toLowerCase())
                      }
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="code"
            render={({ field, fieldState }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium">Verification code</FormLabel>
                <FormControl>
                  <CodeInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={expired || isLoading}
                    invalid={!!fieldState.error}
                    autoFocus={!!initialEmail}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expiry */}
          <p
            className={cn(
              "flex items-center gap-1.5 text-sm",
              expired
                ? "text-red-600 dark:text-red-400"
                : timeLeft <= 60
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground",
            )}
            aria-live="polite"
          >
            <Clock className="h-4 w-4" />
            {expired
              ? "This code has expired. Request a new one below."
              : `Code expires in ${formatTime(timeLeft)}`}
          </p>

          <button
            type="submit"
            disabled={isLoading || expired}
            className={primaryBtn}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify email"
            )}
          </button>
        </form>
      </Form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={handleResendCode}
          disabled={isResending || cooldown > 0}
          className="font-medium text-[#0E5A43] hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60 dark:text-emerald-400"
        >
          {isResending
            ? "Sending..."
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend code"}
        </button>
      </p>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailForm />
    </Suspense>
  );
}