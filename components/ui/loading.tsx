"use client"

import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

type LoadingProps = {
  size?: number
  text?: string
}

type LoadingState = "loading" | "success" | "error"

export function LoadingSpinner({ size = 28, text }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 className="animate-spin text-primary" style={{ width: size, height: size }} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}

export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-base text-muted-foreground">{text}</p>
    </div>
  )
}

export function AdvancedLoader({
  variant = "spinner",
  text = "Loading...",
  size = "md",
}: {
  variant?: "spinner" | "pulse" | "dots" | "bars"
  text?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "gap-1",
    md: "gap-2",
    lg: "gap-3",
  }

  return (
    <div className={`flex flex-col items-center justify-center ${sizeClasses[size]}`}>
      {variant === "spinner" && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
      {variant === "pulse" && <div className="h-8 w-8 rounded-full bg-primary animate-pulse" />}
      {variant === "dots" && (
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="h-3 w-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      )}
      {variant === "bars" && (
        <div className="flex gap-1 items-end">
          <div className="h-8 w-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="h-6 w-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "100ms" }} />
          <div className="h-8 w-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
        </div>
      )}
      {text && <p className="text-sm text-muted-foreground text-center">{text}</p>}
    </div>
  )
}

export function LoadingStateIndicator({
  state = "loading",
  text,
  successText = "Done!",
  errorText = "Error",
}: {
  state?: LoadingState
  text?: string
  successText?: string
  errorText?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {state === "loading" && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
      {state === "success" && <CheckCircle2 className="h-8 w-8 text-green-500" />}
      {state === "error" && <AlertCircle className="h-8 w-8 text-destructive" />}

      <p className="text-sm font-medium">
        {state === "loading" && text}
        {state === "success" && successText}
        {state === "error" && errorText}
      </p>
    </div>
  )
}

export function SkeletonLoader({ count = 3, lines = 3 }: { count?: number; lines?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-muted rounded-md animate-pulse w-3/4" />
          {Array.from({ length: lines - 1 }).map((_, j) => (
            <div key={j} className="h-3 bg-muted rounded-md animate-pulse w-full" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-4 space-y-3">
          <div className="h-6 bg-muted rounded-md animate-pulse w-1/2" />
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded-md animate-pulse w-full" />
            <div className="h-3 bg-muted rounded-md animate-pulse w-5/6" />
            <div className="h-3 bg-muted rounded-md animate-pulse w-4/6" />
          </div>
          <div className="h-10 bg-muted rounded-md animate-pulse w-1/3 mt-4" />
        </div>
      ))}
    </div>
  )
}

export function ProgressLoader({
  progress = 0,
  text = "Loading...",
  showPercentage = true,
}: {
  progress?: number
  text?: string
  showPercentage?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full max-w-xs">
      <p className="text-sm text-muted-foreground text-center">{text}</p>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {showPercentage && <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>}
    </div>
  )
}

export function OverlayLoader({
  visible = true,
  text = "Loading...",
  variant = "spinner",
}: {
  visible?: boolean
  text?: string
  variant?: "spinner" | "pulse" | "dots" | "bars"
}) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
        <AdvancedLoader variant={variant} text={text} size="lg" />
      </div>
    </div>
  )
}
