"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const plan = searchParams.get("plan")
  const storeId = searchParams.get("storeId")

  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (!reference) {
      toast.error("Missing reference")
      router.push("/dashboard/seller/subscriptions")
      return
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          console.error("Verification failed:", data)
          toast.error("Payment verification failed")
          router.push("/dashboard/seller/subscriptions")
          return
        }

        setVerified(true)
        toast.success("Subscription updated successfully")

        // ✅ redirect after success
        setTimeout(() => {
          router.push("/dashboard/seller/subscriptions")
        }, 2000)
      } catch (err) {
        console.error(err)
        toast.error("Verification error")
        router.push("/dashboard/seller/subscriptions")
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [reference, router])

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-lg text-slate-700 dark:text-slate-300">Verifying your payment…</p>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center">
        <CheckCircle className="h-16 w-16 text-emerald-600" />
        <h2 className="mt-4 text-2xl font-semibold">Payment Verified</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Your subscription has been updated successfully.
        </p>
      </div>
    )
  }

  return null
}
