// app/checkout/payment-success/page.tsx
"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react"

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

  const [verificationState, setVerificationState] = useState<
    "verifying" | "polling" | "success" | "error"
  >("verifying")
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string>("")
  const [pollAttempts, setPollAttempts] = useState(0)
  const [countdown, setCountdown] = useState(5)

  const MAX_POLL_ATTEMPTS = 20 // Poll for up to 40 seconds (20 attempts × 2s)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const attemptCountRef = useRef(0)

  // Verify payment and poll for order creation
  useEffect(() => {
    if (!reference) {
      setError("No payment reference found")
      setVerificationState("error")
      return
    }

    const verifyPayment = async () => {
      try {
        console.log(`[Poll Attempt ${attemptCountRef.current + 1}] Verifying payment...`)
        
        const response = await fetch(
          `/api/webhooks/paystack?reference=${reference}`,
          {
            method: "GET",
            credentials: "include",
          }
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Payment verification failed")
        }

        const data: VerificationResult = await response.json()
        console.log("[Verification Response]", data)
        setResult(data)

        // Handle subscription payments
        if (data.data.type === "subscription") {
          if (data.data.subscriptionUpdated) {
            console.log("✅ Subscription updated successfully")
            setVerificationState("success")
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            // Redirect to store dashboard after 3 seconds
            setTimeout(() => {
              router.push("/seller/dashboard")
            }, 3000)
            return true // Stop polling
          } else {
            console.log("⏳ Subscription not yet updated, continuing to poll...")
            setVerificationState("polling")
            return false // Continue polling
          }
        }

        // Handle order payments
        if (data.data.orderExists && data.data.orderNumber) {
          console.log("✅ Order created successfully:", data.data.orderNumber)
          setVerificationState("success")
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          // Redirect to order confirmation after 3 seconds
          setTimeout(() => {
            router.push(`/orders/${data.data.orderNumber}`)
          }, 3000)
          return true // Stop polling
        } else {
          console.log("⏳ Order not yet created, continuing to poll...")
          setVerificationState("polling")
          return false // Continue polling
        }
      } catch (err: any) {
        console.error("❌ Verification error:", err)
        setError(err.message || "Failed to verify payment")
        setVerificationState("error")
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        return true // Stop polling on error
      }
    }

    const startPolling = async () => {
      // Initial verification
      const shouldStop = await verifyPayment()
      if (shouldStop) return

      attemptCountRef.current = 1
      setPollAttempts(1)

      // Set up polling interval (every 2 seconds)
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
            "Order creation is taking longer than expected. Your payment was successful. Please check your orders page or contact support with the reference below."
          )
          setVerificationState("error")
          return
        }

        const shouldStop = await verifyPayment()
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
  }, [reference, router])

  // Separate countdown effect for error state
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | undefined
    
    if (verificationState === "error") {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownInterval) clearInterval(countdownInterval)
            router.push("/checkout")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, [verificationState, router])

  if (!reference) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Request</h1>
          <p className="text-gray-600 mb-6">No payment reference found.</p>
          <button
            onClick={() => router.push("/checkout")}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Return to Checkout
          </button>
        </div>
      </div>
    )
  }

  if (verificationState === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
          <p className="text-gray-600">
            Verifying your payment with Paystack...
          </p>
        </div>
      </div>
    )
  }

  if (verificationState === "polling") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Verified!</h1>
          <p className="text-gray-600 mb-4">
            Creating your {result?.data.type === "subscription" ? "subscription" : "order"}...
          </p>
          <p className="text-sm text-gray-500 mb-2">
            This may take a few moments...
          </p>
          <p className="text-xs text-gray-400">
            Attempt {pollAttempts} of {MAX_POLL_ATTEMPTS}
          </p>
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(pollAttempts / MAX_POLL_ATTEMPTS) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (verificationState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {result?.data.paymentStatus === "success" 
              ? "Payment Verification Delayed" 
              : "Payment Verification Failed"}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Payment Reference:
            </p>
            <p className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border break-all">
              {reference}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Save this reference for support inquiries
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/orders")}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Check My Orders
            </button>
            <button
              onClick={() => router.push("/checkout")}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Return to Checkout
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Redirecting to checkout in {countdown} seconds...
          </p>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {result?.data.type === "subscription" 
            ? "Subscription Activated!" 
            : "Order Confirmed!"}
        </h1>
        
        {result?.data.type === "subscription" ? (
          <div>
            <p className="text-gray-600 mb-4">
              Your {result.data.plan} subscription has been activated successfully.
            </p>
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-1">Plan</p>
              <p className="text-lg font-bold text-green-600 capitalize">
                {result.data.plan}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Redirecting to your store dashboard...
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              Your order has been successfully placed and payment confirmed.
            </p>
            <div className="bg-green-50 rounded-lg p-4 mb-6 space-y-2">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Order Number
                </p>
                <p className="text-lg font-bold text-green-600">
                  {result?.data.orderNumber}
                </p>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-semibold">
                  ₦{result?.data.grandTotal?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="font-semibold">
                  {result?.data.subOrderCount} store(s)
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Redirecting to order details...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Main component with Suspense wrapper
export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
            <p className="text-gray-600">
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