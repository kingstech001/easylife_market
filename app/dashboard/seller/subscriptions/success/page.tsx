"use client"

import { useEffect, useState, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Loader2, XCircle, ArrowRight, Clock, Sparkles, CreditCard, Package } from "lucide-react"
import { toast } from "sonner"

// This forces the route to be dynamic and not prerendered
export const dynamic = 'force-dynamic'

interface VerificationResult {
  status: string
  message: string
  success?: boolean
  data?: {
    reference?: string
    paymentStatus?: string
    plan?: string
    productLimit?: number
    subscriptionUpdated?: boolean
  }
}

function SubscriptionSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const planParam = searchParams.get("plan")
  const storeIdParam = searchParams.get("storeId")

  const [verificationState, setVerificationState] = useState<
    "verifying" | "polling" | "success" | "error"
  >("verifying")
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string>("")
  const [pollAttempts, setPollAttempts] = useState(0)
  const [countdown, setCountdown] = useState(10)
  const [plan, setPlan] = useState("")
  const [productLimit, setProductLimit] = useState<number | null>(null)

  const MAX_POLL_ATTEMPTS = 30 // 60 seconds for webhook processing
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const attemptCountRef = useRef(0)

  useEffect(() => {
    if (!reference) {
      setError("Payment reference not found in URL")
      setVerificationState("error")
      toast.error("Invalid payment link")
      return
    }

    const checkSubscriptionStatus = async () => {
      try {
        console.log(`[Poll Attempt ${attemptCountRef.current + 1}] Checking subscription status...`)
        
        const response = await fetch(`/api/paystack/verify?reference=${reference}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })

        console.log("📡 Response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json()
          
          // If payment not successful, show error immediately
          if (response.status === 400 && errorData.error?.includes("not successful")) {
            throw new Error(errorData.error || "Payment was not successful")
          }
          
          // Other errors - keep polling
          console.log("⏳ Webhook still processing...", errorData)
          return false
        }

        const data: VerificationResult = await response.json()
        console.log("[Subscription Status Response]", data)
        setResult(data)

        // Check multiple success indicators
        const isSuccess = 
          response.ok && (
            data.status === "success" || 
            data.success === true || 
            data.data?.paymentStatus === "success" ||
            data.data?.subscriptionUpdated === true ||
            (data.message && (
              data.message.includes("verified and updated successfully") ||
              data.message.includes("Subscription payment verified") ||
              data.message.includes("already processed")
            ))
          )

        if (isSuccess && data.data?.subscriptionUpdated) {
          console.log("✅ Subscription updated successfully")
          
          // Extract plan and product limit from response
          const extractedPlan = planParam || data.data?.plan || ""
          const extractedProductLimit = data.data?.productLimit || null
          
          setPlan(extractedPlan)
          setProductLimit(extractedProductLimit)
          setVerificationState("success")
          
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          
          toast.success("Payment successful!", {
            description: `Your ${extractedPlan} plan has been activated.`,
          })
          
          setTimeout(() => {
            router.push("/dashboard/seller/subscriptions")
          }, 3000)
          
          return true
        } else if (data.data?.paymentStatus === "success") {
          // Payment verified but subscription not yet updated - webhook is still processing
          console.log("⏳ Payment verified, waiting for subscription update...")
          setVerificationState("polling")
          return false
        } else {
          throw new Error("Payment verification failed")
        }
      } catch (err: any) {
        console.error("❌ Status check error:", err)
        setError(err.message || "Failed to verify payment")
        setVerificationState("error")
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        return true
      }
    }

    const startPolling = async () => {
      // First check
      const shouldStop = await checkSubscriptionStatus()
      if (shouldStop) return

      attemptCountRef.current = 1
      setPollAttempts(1)

      // Poll every 2 seconds
      pollIntervalRef.current = setInterval(async () => {
        attemptCountRef.current += 1
        setPollAttempts(attemptCountRef.current)

        if (attemptCountRef.current >= MAX_POLL_ATTEMPTS) {
          console.log("⚠️ Max polling attempts reached")
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setError(
            "Subscription activation is taking longer than expected. Your payment was successful. Please check your subscriptions page in a few minutes or contact support."
          )
          setVerificationState("error")
          return
        }

        const shouldStop = await checkSubscriptionStatus()
        if (shouldStop && pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
      }, 2000)
    }

    startPolling()

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [reference, planParam, router])

  // Separate countdown effect for error state
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | undefined

    if (verificationState === "error") {
      setCountdown(10)
      countdownInterval = setInterval(() => {
        setCountdown((prev) => Math.max(prev - 1, 0))
      }, 1000)
    }

    return () => {
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, [verificationState])

  // Navigate after countdown reaches zero
  useEffect(() => {
    if (verificationState === "error" && countdown === 0) {
      router.push("/dashboard/seller/subscriptions")
    }
  }, [verificationState, countdown, router])

  if (!reference) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-md w-full bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 p-8 text-center relative z-10">
          <div className="p-4 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Invalid Request
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">No payment reference found.</p>
          <button
            onClick={() => router.push("/dashboard/seller/subscriptions")}
            className="w-full bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] text-white font-semibold py-4 rounded-xl hover:shadow-xl hover:shadow-[#c0a146]/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            Return to Subscriptions
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  if (verificationState === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-[#c0a146]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-md w-full bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 p-8 text-center relative z-10">
          <div className="p-4 rounded-full bg-gradient-to-br from-[#c0a146]/20 to-primary/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-[#c0a146] animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Processing Payment
          </h1>
          <p className="text-muted-foreground text-lg">
            Verifying your payment with Paystack...
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-[#c0a146] rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-[#c0a146] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-[#c0a146] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    )
  }

  if (verificationState === "polling") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-[#c0a146]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-md w-full bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 p-8 text-center relative z-10">
          <div className="p-4 rounded-full bg-gradient-to-br from-[#c0a146]/20 to-primary/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Clock className="w-12 h-12 text-[#c0a146] animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Payment Verified!
            </h1>
          </div>
          <p className="text-muted-foreground mb-2 text-lg">
            Activating your subscription...
          </p>
          <p className="text-sm text-muted-foreground/70 mb-6">
            Our secure payment system is processing your subscription. This may take a few moments...
          </p>
          
          <div className="bg-muted/30 rounded-xl p-4 mb-6 border border-border/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
              <span className="text-sm font-semibold text-[#c0a146]">
                {pollAttempts} / {MAX_POLL_ATTEMPTS}
              </span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#c0a146] to-[#d4b55e] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(pollAttempts / MAX_POLL_ATTEMPTS) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-[#c0a146]" />
            <span>Setting up your subscription details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (verificationState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-md w-full bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 p-8 text-center relative z-10">
          <div className="p-4 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            {result?.data?.paymentStatus === "success" 
              ? "Payment Verification Delayed" 
              : "Payment Verification Failed"}
          </h1>
          <p className="text-muted-foreground mb-6 text-lg">{error}</p>
          
          <div className="bg-muted/30 rounded-xl p-5 mb-6 text-left border border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-[#c0a146]" />
              <p className="text-sm font-semibold text-foreground">
                Payment Reference
              </p>
            </div>
            <p className="text-sm text-foreground font-mono bg-muted/50 px-4 py-3 rounded-lg border border-border/30 break-all">
              {reference}
            </p>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Save this reference for support inquiries
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/dashboard/seller/subscriptions")}
              className="w-full bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] text-white font-semibold py-4 rounded-xl hover:shadow-xl hover:shadow-[#c0a146]/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              Check My Subscriptions
            </button>
            <button
              onClick={() => router.push("/dashboard/seller/subscriptions")}
              className="w-full bg-muted/50 text-foreground font-semibold py-4 rounded-xl hover:bg-muted/70 border border-border/50 hover:border-[#c0a146]/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Return to Subscriptions
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-border/30">
            <p className="text-sm text-muted-foreground">
              Redirecting to subscriptions in <span className="font-bold text-[#c0a146]">{countdown}</span> seconds...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-[#c0a146]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-md w-full bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 p-8 text-center relative z-10">
        {/* Success icon with animation */}
        <div className="relative mb-6">
          <div className="p-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 w-20 h-20 mx-auto flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 animate-ping" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Subscription Activated!
        </h1>
        
        <p className="text-muted-foreground mb-6 text-lg">
          Your subscription has been successfully activated and payment confirmed.
        </p>
        
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl p-6 mb-6 space-y-4 border border-emerald-500/30">
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-semibold text-muted-foreground">
                Subscription Plan
              </p>
            </div>
            <p className="text-2xl font-bold text-emerald-600 capitalize">
              {plan} Plan
            </p>
          </div>
          
          {productLimit !== null && (
            <div className="border-t border-border/30 pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Product Limit:</span>
                <span className="font-bold text-lg bg-gradient-to-r from-[#c0a146] to-[#d4b55e] bg-clip-text text-transparent">
                  {productLimit >= 999999 ? "Unlimited" : `${productLimit} products`}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-[#c0a146]" />
          <span>Redirecting to subscriptions...</span>
        </div>
      </div>
    </div>
  )
}

// Loading fallback
function SubscriptionSuccessLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-[#c0a146]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <div className="max-w-md w-full bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border/50 p-8 text-center relative z-10">
        <div className="p-4 rounded-full bg-gradient-to-br from-[#c0a146]/20 to-primary/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-[#c0a146] animate-spin" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Loading...
        </h1>
        <p className="text-muted-foreground text-lg">
          Please wait while we verify your payment...
        </p>
      </div>
    </div>
  )
}

// Main component with Suspense
export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<SubscriptionSuccessLoading />}>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}