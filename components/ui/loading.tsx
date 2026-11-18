"use client"

import { CheckCircle2, AlertCircle } from "lucide-react"
import { BrandLoader } from "@/components/ui/brand-loader"
import { Spinner } from "@/components/ui/spinner"
export { BrandLoader } from "@/components/ui/brand-loader"

type LoadingProps = { size?: number; text?: string }
type LoadingState = "loading" | "success" | "error"

export function LoadingSpinner({ size = 28, text }: LoadingProps) {
  return <span className="inline-flex flex-col items-center justify-center gap-2">
    <Spinner size={size} aria-label={text || "Loading"} />
    {text && <span className="text-center text-sm text-muted-foreground">{text}</span>}
  </span>
}

export function PageLoader({ text }: { text?: string }) {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6">
    <BrandLoader size={96} aria-label={text || "Loading page"} />
    {text && <p className="text-sm text-muted-foreground">{text}</p>}
  </div>
}

export function AdvancedLoader({ text, size = "md" }: {
  variant?: "spinner" | "pulse" | "dots" | "bars"; text?: string; size?: "sm" | "md" | "lg"
}) {
  return <LoadingSpinner size={{ sm: 20, md: 28, lg: 40 }[size]} text={text} />
}

export function LoadingStateIndicator({ state = "loading", text, successText = "Done!", errorText = "Error" }: {
  state?: LoadingState; text?: string; successText?: string; errorText?: string
}) {
  if (state === "loading") return <LoadingSpinner size={28} text={text} />
  return <div className="flex flex-col items-center justify-center gap-2">
    {state === "success" ? <CheckCircle2 className="h-8 w-8 text-green-500" /> : <AlertCircle className="h-8 w-8 text-destructive" />}
    <p className="text-sm font-medium">{state === "success" ? successText : errorText}</p>
  </div>
}

export function SkeletonLoader(_props: { count?: number; lines?: number }) {
  return <div className="flex min-h-48 items-center justify-center p-6"><LoadingSpinner size={32} /></div>
}

export function SkeletonCard(_props: { count?: number; lines?: number }) {
  return <div className="flex min-h-48 items-center justify-center p-6"><LoadingSpinner size={32} /></div>
}

export function ProgressLoader({
  progress = 0,
  // text = "Loading...",
  showPercentage = true,
}: {
  progress?: number
  text?: string
  showPercentage?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full max-w-xs">
      <Spinner size={28} />
      {/* <p className="text-sm text-muted-foreground text-center">{text}</p> */}
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
  text,
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
