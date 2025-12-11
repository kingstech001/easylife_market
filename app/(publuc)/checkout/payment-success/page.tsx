"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { toast } from "sonner"

// Force dynamic rendering
export const dynamic = "force-dynamic"

/**
 * Poll for order creation after webhook processes payment
 * The webhook processes the payment asynchronously, so we need to wait
 * Uses the existing /api/paystack/verify endpoint which checks for orders
 */
async function pollForOrder(reference: string, maxAttempts = 15): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`/api/paystack/verify?reference=${reference}`, {
        method: "GET",
      })

      if (res.ok) {
        const data = await res.json()
        
        // Check if order exists in the response
        if (data.data?.orderExists && data.data?.orderNumber) {
          return {
            orderNumber: data.data.orderNumber,
            reference: data.data.reference,
            status: data.data.status,
            paymentStatus: data.data.paymentStatus,
            grandTotal: data.data.amount,
          }
        }
      }

      // Wait before next attempt (exponential backoff)
      const delay = Math.min(1000 * Math.pow(1.3, attempt), 5000)
      await new Promise((resolve) => setTimeout(resolve, delay))
    } catch (error) {
      console.error(`Poll attempt ${attempt} failed:`, error)
    }
  }

  throw new Error("Order not found after payment verification")
}

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get reference from query params (Paystack redirects with these)
  const reference = searchParams.get("reference") || searchParams.get("trxref")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState<string>("Verifying your payment...")
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  useEffect(() => {
    if (!reference) {
      toast.error("Missing payment reference")
      setStatus("error")
      setMessage("Payment reference not found. Please contact support.")
      
      setTimeout(() => {
        router.push("/checkout")
      }, 3000)
      return
    }

    const verifyPaymentAndOrder = async () => {
      try {
        console.log("[PaymentSuccess] Checking payment for reference:", reference)

        // Step 1: Check if payment was successful via GET endpoint
        // This doesn't process anything, just checks Paystack status
        const checkRes = await fetch(`/api/paystack/verify?reference=${reference}`, {
          method: "GET",
        })

        if (!checkRes.ok) {
          const errorData = await checkRes.json()
          throw new Error(errorData.error || "Payment verification failed")
        }

        const checkData = await checkRes.json()
        console.log("[PaymentSuccess] Payment status:", checkData)

        if (checkData.data?.paymentStatus !== "success") {
          throw new Error("Payment was not successful")
        }

        // Step 2: Wait for webhook to process and create order
        // The webhook runs asynchronously, so we poll for the order
        setMessage("Payment verified! Creating your order...")
        
        console.log("[PaymentSuccess] Polling for order creation...")
        const order = await pollForOrder(reference)

        console.log("[PaymentSuccess] Order found:", order)

        // Step 3: Success! Show confirmation
        setStatus("success")
        setOrderNumber(order.orderNumber)
        setMessage("Your order has been placed successfully!")

        toast.success("Order placed successfully!")

        // Redirect to order confirmation page
        setTimeout(() => {
          router.push(`/orders/${order.orderNumber}`)
        }, 2000)
      } catch (error: any) {
        console.error("[PaymentSuccess] Error:", error)
        
        setStatus("error")
        setMessage(
          error.message || 
          "Failed to verify payment. Please contact support with your payment reference."
        )

        toast.error(error.message || "Payment verification failed")

        // Redirect to checkout after delay
        setTimeout(() => {
          router.push("/checkout")
        }, 5000)
      }
    }

    verifyPaymentAndOrder()
  }, [reference, router])

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Processing Payment</h2>
        <p className="text-muted-foreground max-w-md">{message}</p>
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>This may take a few moments...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Payment Verification Failed</h2>
        <p className="text-muted-foreground max-w-md mb-4">{message}</p>
        {reference && (
          <div className="bg-muted p-4 rounded-lg max-w-md mb-4">
            <p className="text-sm font-medium mb-1">Payment Reference:</p>
            <p className="text-xs font-mono break-all">{reference}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Save this reference for support inquiries
            </p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Redirecting to checkout in 5 seconds...
        </p>
      </div>
    )
  }

  // Success state
  if (status === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground max-w-md mb-4">{message}</p>
        
        {orderNumber && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg max-w-md mb-4">
            <p className="text-sm font-medium text-green-900 mb-1">Order Number:</p>
            <p className="text-lg font-bold text-green-700">{orderNumber}</p>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          You will receive a confirmation email shortly.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Redirecting to your order...
        </p>
      </div>
    )
  }

  return null
}

// Loading fallback
function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
    </div>
  )
}

// Main component with Suspense boundary
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}