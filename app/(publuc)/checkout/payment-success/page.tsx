"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useCart } from "@/context/cart-context"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const CHECKOUT_STORAGE_KEY = "checkout_form_data"

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearCart, items: cartItems, getTotalPrice } = useCart()
  const reference = searchParams.get("reference") || searchParams.get("trxref")

  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reference) {
      toast.error("Missing payment reference")
      router.push("/checkout")
      return
    }

    const verifyPayment = async () => {
      try {
        console.log("[PaymentSuccess] Verifying payment with reference:", reference)

        // Get checkout data from localStorage
        const checkoutDataStr = localStorage.getItem(CHECKOUT_STORAGE_KEY)
        if (!checkoutDataStr) {
          throw new Error("Checkout data not found. Please try again.")
        }

        const checkoutData = JSON.parse(checkoutDataStr)
        const { info, shipping } = checkoutData

        // Prepare order data
        const groupedByStore: Record<string, typeof cartItems> = {}
        cartItems.forEach((item) => {
          if (!groupedByStore[item.storeId]) groupedByStore[item.storeId] = []
          groupedByStore[item.storeId].push(item)
        })

        const orders = Object.entries(groupedByStore).map(([storeId, storeItems]) => {
          const storeSubtotal = storeItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
          return {
            storeId,
            items: storeItems.map((i) => ({
              productId: i.productId,
              productName: i.name,
              quantity: i.quantity,
              priceAtPurchase: i.price,
            })),
            totalPrice: storeSubtotal,
          }
        })

        const subtotal = getTotalPrice()
        const total = subtotal + shipping

        const orderData = {
          orders,
          shippingInfo: {
            firstName: info.firstName,
            lastName: info.lastName,
            email: info.email,
            address: info.address,
            state: info.state,
            phone: info.phone,
            area: info.area,
          },
          paymentMethod: "paystack",
          deliveryFee: shipping,
          totalAmount: Math.round(total * 100),
        }

        console.log("[PaymentSuccess] Sending order data with reference")

        // Verify payment and create orders
        const res = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference,
            orderData,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          console.error("[PaymentSuccess] Verification failed:", data)
          throw new Error(data.error || "Payment verification failed")
        }

        console.log("[PaymentSuccess] Payment verified and order created successfully:", data)

        setVerified(true)
        
        // Clear cart and checkout data
        clearCart()
        localStorage.removeItem(CHECKOUT_STORAGE_KEY)
        
        toast.success("Payment successful! Your order has been placed.")

        // Redirect to confirmation page after 2 seconds
        setTimeout(() => {
          router.push(`/checkout/confirmation?reference=${reference}`)
        }, 2000)
      } catch (err: any) {
        console.error("[PaymentSuccess] Verification error:", err)
        setError(err.message || "Payment verification error")
        toast.error(err.message || "Failed to verify payment")
        
        // Don't redirect immediately on error - show the error
        setTimeout(() => {
          router.push("/checkout")
        }, 5000)
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [reference, router, clearCart, cartItems, getTotalPrice])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Verifying Payment</h2>
        <p className="text-muted-foreground">
          Please wait while we verify your payment and create your order...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Verification Failed</h2>
        <p className="text-muted-foreground max-w-md">
          {error}
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Redirecting to checkout in 5 seconds...
        </p>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Payment Verified!</h2>
        <p className="text-muted-foreground max-w-md">
          Your order has been placed successfully. You will receive a confirmation email shortly.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Redirecting to order confirmation...
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

// Main component with Suspense
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}