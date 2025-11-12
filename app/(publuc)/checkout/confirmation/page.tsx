"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function PaymentConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get("reference")

        // Otherwise, assume verification was already done in checkout
        if (reference) {
          console.log("[v0] Verifying payment from Paystack redirect with reference:", reference)
          const response = await fetch(`/api/paystack/verify?reference=${reference}`)
          const data = await response.json()

          if (response.ok && data.status === "success") {
            setStatus("success")
            setMessage("Your payment has been verified and your order has been created successfully!")
          } else {
            setStatus("error")
            setMessage(data.error || "Payment verification failed")
          }
        } else {
          // No reference means verification was done in checkout page
          setStatus("success")
          setMessage("Your payment has been verified and your order has been created successfully!")
        }
      } catch (error) {
        console.error("[v0] Payment verification error:", error)
        setStatus("error")
        setMessage("An error occurred while verifying your payment")
      }
    }

    verifyPayment()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <CardTitle>Verifying Payment</CardTitle>
              <CardDescription>Please wait while we verify your payment...</CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <CardTitle>Payment Successful!</CardTitle>
              <CardDescription>Your order has been placed successfully</CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <CardTitle>Payment Failed</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "success" && <p className="text-sm text-muted-foreground text-center">{message}</p>}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/")} className="flex-1">
              Back to Home
            </Button>
            {status === "success" && (
              <Button onClick={() => router.push("/dashboard/buyer/orders")} className="flex-1">
                View Orders
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Loading fallback
function PaymentConfirmationLoading() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
    </div>
  )
}

// Main component with Suspense
export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={<PaymentConfirmationLoading />}>
      <PaymentConfirmationContent />
    </Suspense>
  )
}