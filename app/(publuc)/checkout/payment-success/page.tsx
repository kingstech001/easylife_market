// app/checkout/payment-success/page.tsx
"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Loader2, Clock, ArrowRight, Sparkles, Package, CreditCard } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { toast } from "sonner"

interface VerificationResult {
  status: string
  message: string
  data: {
    reference: string
    paymentStatus: string
    amount: number
    orderExists: boolean
    orderNumber?: string
    status?: string
    grandTotal?: number
    subOrderCount?: number
    type?: string
    plan?: string
    subscriptionUpdated?: boolean
  }
}

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference") || searchParams.get("trxref")
  const { clearCart } = useCart()

  const [verificationState, setVerificationState] = useState<
    "verifying" | "polling" | "success" | "error"
  >("verifying")
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string>("")
  const [pollAttempts, setPollAttempts] = useState(0)
  const [countdown, setCountdown] = useState(10)

  const MAX_POLL_ATTEMPTS = 30 // Increased to 60 seconds for webhook processing
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const attemptCountRef = useRef(0)
  const cartClearedRef = useRef(false)

  // Verify payment and poll for order creation
  useEffect(() => {
    if (!reference) {
      setError("No payment reference found")
      setVerificationState("error")
      return
    }

    const checkOrderStatus = async () => {
      try {
        console.log(`[Poll Attempt ${attemptCountRef.current + 1}] Checking order status...`)
        
        // ✅ Call webhook GET endpoint to check if order was created
        const response = await fetch(
          `/api/webhooks/paystack?reference=${reference}`,
          {
            method: "GET",
            credentials: "include",
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          
          // If payment not successful, show error immediately
          if (response.status === 400 && errorData.error?.includes("not successful")) {
            throw new Error(errorData.error || "Payment was not successful")
          }
          
          // Other errors - keep polling (webhook might still be processing)
          console.log("⏳ Webhook still processing...", errorData)
          return false
        }

        const data: VerificationResult = await response.json()
        console.log("[Order Status Response]", data)
        setResult(data)

        // Handle subscription payments (if any subscription payments go through checkout)
        if (data.data.type === "subscription") {
          if (data.data.subscriptionUpdated) {
            console.log("✅ Subscription updated successfully")
            setVerificationState("success")
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            
            if (!cartClearedRef.current) {
              clearCart()
              cartClearedRef.current = true
              console.log("🗑️ Cart cleared after subscription payment")
            }
            
            setTimeout(() => {
              router.push("/dashboard/seller/subscriptions")
            }, 3000)
            return true
          } else {
            console.log("⏳ Subscription not yet updated, continuing to poll...")
            setVerificationState("polling")
            return false
          }
        }

        // Handle order payments - check if webhook created the order
        if (data.data.orderExists && data.data.orderNumber) {
          console.log("✅ Order created successfully:", data.data.orderNumber)
          setVerificationState("success")
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          
          if (!cartClearedRef.current) {
            clearCart()
            cartClearedRef.current = true
            console.log("🗑️ Cart cleared after order creation")
            toast.success("Payment successful! Your order has been placed.")
          }
          
          setTimeout(() => {
            router.push(`/dashboard/buyer/orders`)
          }, 3000)
          return true
        } else if (data.data.paymentStatus === "success") {
          // Payment verified but order not yet created - webhook is still processing
          console.log("⏳ Payment verified, waiting for webhook to create order...")
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
      const shouldStop = await checkOrderStatus()
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
            "Order creation is taking longer than expected. Your payment was successful. Please check your orders page in a few minutes or contact support."
          )
          setVerificationState("error")
          return
        }

        const shouldStop = await checkOrderStatus()
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
  }, [reference, router, clearCart])

  // Separate countdown effect for error state
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | undefined

    if (verificationState === "error") {
      setCountdown(10) // Give more time for checkout errors
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
      router.push("/dashboard/buyer/orders") // Go to orders page instead of checkout
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
            onClick={() => router.push("/checkout")}
            className="w-full bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] text-white font-semibold py-4 rounded-xl hover:shadow-xl hover:shadow-[#c0a146]/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            Return to Checkout
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
            Creating your order...
          </p>
          <p className="text-sm text-muted-foreground/70 mb-6">
            Our secure payment system is processing your order. This may take a few moments...
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
            <span>Setting up your order details...</span>
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
            {result?.data.paymentStatus === "success" 
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
              onClick={() => router.push("/dashboard/buyer/orders")}
              className="w-full bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] text-white font-semibold py-4 rounded-xl hover:shadow-xl hover:shadow-[#c0a146]/30 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              Check My Orders
            </button>
            <button
              onClick={() => router.push("/checkout")}
              className="w-full bg-muted/50 text-foreground font-semibold py-4 rounded-xl hover:bg-muted/70 border border-border/50 hover:border-[#c0a146]/50 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Return to Checkout
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-border/30">
            <p className="text-sm text-muted-foreground">
              Redirecting to orders in <span className="font-bold text-[#c0a146]">{countdown}</span> seconds...
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
          Order Confirmed!
        </h1>
        
        <p className="text-muted-foreground mb-6 text-lg">
          Your order has been successfully placed and payment confirmed.
        </p>
        
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl p-6 mb-6 space-y-4 border border-emerald-500/30">
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Package className="w-5 h-5 text-emerald-500" />
              <p className="text-sm font-semibold text-muted-foreground">
                Order Number
              </p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {result?.data.orderNumber}
            </p>
          </div>
          <div className="border-t border-border/30 pt-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold text-lg bg-gradient-to-r from-[#c0a146] to-[#d4b55e] bg-clip-text text-transparent">
                ₦{result?.data.grandTotal?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-semibold text-foreground">
                {result?.data.subOrderCount} store(s)
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-[#c0a146]" />
          <span>Redirecting to order details...</span>
        </div>
      </div>
    </div>
  )
}

// Main component with Suspense wrapper
export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}