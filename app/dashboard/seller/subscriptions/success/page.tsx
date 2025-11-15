"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, Loader2, XCircle, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// This forces the route to be dynamic and not prerendered
export const dynamic = 'force-dynamic'

function SubscriptionSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [plan, setPlan] = useState("")

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get("reference")
      const planParam = searchParams.get("plan")
      
      console.log("🔍 Verifying payment with reference:", reference)
      
      if (!reference) {
        console.error("❌ No reference found in URL")
        setStatus("error")
        setMessage("Payment reference not found")
        return
      }

      try {
        console.log("📡 Calling verify API...")
        
        // Use GET method since that's what your API expects for the callback
        const response = await fetch(`/api/paystack/verify?reference=${reference}`, {
          method: "GET",
          credentials: "include", // Important: include cookies
        })

        console.log("📡 Verify response status:", response.status)

        const data = await response.json()
        console.log("📡 Verify response data:", JSON.stringify(data, null, 2))

        // ✅ Check for success - check ALL possible success indicators
        const isSuccess = 
          response.ok && (
            data.status === "success" || 
            data.success === true || 
            data.data?.paymentStatus === "success" ||
            (data.message && data.message.includes("verified and updated successfully"))
          )

        if (isSuccess) {
          console.log("✅ Payment verified successfully!")
          setStatus("success")
          setMessage(data.message || "Subscription activated successfully!")
          setPlan(planParam || data.data?.plan || data.plan || "")
          toast.success("Payment successful!", {
            description: "Your subscription has been activated."
          })
        } else {
          console.error("❌ Payment verification failed:", data)
          setStatus("error")
          setMessage(data.error || data.message || "Payment verification failed")
          toast.error("Payment verification failed", {
            description: data.error || "Please contact support if the issue persists."
          })
        }
      } catch (error: any) {
        console.error("❌ Verification error:", error)
        setStatus("error")
        setMessage("An error occurred while verifying your payment")
        toast.error("Verification failed", {
          description: "Please try refreshing the page."
        })
      }
    }

    verifyPayment()
  }, [searchParams])

  const handleContinue = () => {
    if (status === "success") {
      router.push("/dashboard/seller")
    } else {
      router.push("/dashboard/seller/subscriptions")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-md shadow-2xl border-2">
          <CardHeader className="text-center space-y-4 pb-8">
            {status === "loading" && (
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
              >
                <CheckCircle className="h-8 w-8 text-green-600" />
              </motion.div>
            )}
            {status === "error" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20"
              >
                <XCircle className="h-8 w-8 text-red-600" />
              </motion.div>
            )}
            
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">
                {status === "loading" && "Verifying Payment..."}
                {status === "success" && "Payment Successful!"}
                {status === "error" && "Payment Failed"}
              </CardTitle>
              <CardDescription className="text-base">
                {status === "loading" && "Please wait while we confirm your payment"}
                {status === "success" && message}
                {status === "error" && message}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {status === "success" && plan && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Subscription Plan</p>
                <p className="text-lg font-bold capitalize">{plan} Plan</p>
              </div>
            )}

            <Button
              onClick={handleContinue}
              disabled={status === "loading"}
              className="w-full h-12"
              size="lg"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : status === "success" ? (
                <>
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Back to Subscriptions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {status === "error" && (
              <p className="text-center text-sm text-muted-foreground">
                Need help?{" "}
                <a href="/dashboard/seller/support" className="text-primary hover:underline">
                  Contact Support
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Loading fallback
function SubscriptionSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading...</p>
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