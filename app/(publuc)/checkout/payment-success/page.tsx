"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/context/cart-context"

const CHECKOUT_STORAGE_KEY = "checkout_form_data"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearCart } = useCart()
  const reference = searchParams.get("reference") || searchParams.get("trxref")

  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (!reference) {
      toast.error("Missing payment reference")
      router.push("/checkout")
      return
    }

    const verifyPayment = async () => {
      try {
        console.log("[v0] Verifying payment with reference:", reference)

        const res = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference,
            // The verify endpoint will retrieve orderData from Paystack metadata
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          console.error("[v0] Verification failed:", data)
          toast.error(data.error || "Payment verification failed")
          router.push("/checkout")
          return
        }

        console.log("[v0] Payment verified successfully:", data)

        setVerified(true)
        
        // Clear cart and checkout data
        clearCart()
        localStorage.removeItem(CHECKOUT_STORAGE_KEY)
        
        toast.success("Payment successful! Your order has been placed.")

        // Redirect to confirmation page after 2 seconds
        setTimeout(() => {
          router.push(`/checkout/confirmation?reference=${reference}`)
        }, 2000)
      } catch (err) {
        console.error("[v0] Verification error:", err)
        toast.error("Payment verification error")
        router.push("/checkout")
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [reference, router, clearCart])

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-lg text-slate-700 dark:text-slate-300">
          Verifying your payment…
        </p>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center">
        <CheckCircle className="h-16 w-16 text-emerald-600" />
        <h2 className="mt-4 text-2xl font-semibold">Payment Verified</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Your order has been placed successfully. Redirecting...
        </p>
      </div>
    )
  }

  return null
}