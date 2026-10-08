"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  ShoppingBag, ChevronRight, Shield, ArrowLeft, Package, Lock, Loader2,
  ChevronDown, Truck, Check, Minus, Plus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapAddressPicker } from "@/components/ui/map-address-picker"
import { useCart } from "@/context/cart-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useFormatAmount } from "@/hooks/useFormatAmount"
import { calculateMaxDeliveryFee } from "@/lib/delivery-fee"

const CHECKOUT_STORAGE_KEY = "checkout_form_data"

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A43]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"

const primaryBtn =
  "inline-flex h-12 items-center justify-center rounded-lg bg-[#0E5A43] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#083B2D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E5A43]/25 disabled:cursor-not-allowed disabled:opacity-60"

const secondaryBtn =
  "inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E5A43]/15 disabled:cursor-not-allowed disabled:opacity-60"

export default function CheckoutPage() {
  const router = useRouter()
  const {
    items: cartItems,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    clearCart,
    getCartItemKey,
  } = useCart()
  const [activeStep, setActiveStep] = useState<"information" | "payment">("information")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [shipping, setShipping] = useState(0)
  const [isHydrated, setIsHydrated] = useState(false)
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [deliveryInfo, setDeliveryInfo] = useState<{ distanceKm: number; tierLabel: string } | null>(null)
  const [isCalculatingFee, setIsCalculatingFee] = useState(false)
  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { formatAmount } = useFormatAmount()

  const [info, setInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    state: "",
    phone: "",
    area: "",
  })

  // Load saved checkout data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(CHECKOUT_STORAGE_KEY)
      if (savedData) {
        const {
          info: savedInfo,
          activeStep: savedStep,
          shipping: savedShipping,
          customerCoords: savedCustomerCoords,
          deliveryInfo: savedDeliveryInfo,
        } = JSON.parse(savedData)
        setInfo(
          savedInfo || {
            firstName: "", lastName: "", email: "", address: "", state: "", phone: "", area: "",
          }
        )
        setActiveStep(savedStep || "information")
        setShipping(savedShipping || 0)
        setCustomerCoords(savedCustomerCoords || null)
        setDeliveryInfo(savedDeliveryInfo || null)
      }
    } catch (error) {
      console.error("Failed to load checkout data from localStorage:", error)
      localStorage.removeItem(CHECKOUT_STORAGE_KEY)
    }
    setIsHydrated(true)
  }, [])

  // Restore checkout state after login redirect
  useEffect(() => {
    if (!isHydrated) return
    try {
      const savedRedirectData = localStorage.getItem("checkout_redirect_data")
      if (savedRedirectData) {
        const data = JSON.parse(savedRedirectData)
        const age = Date.now() - data.timestamp
        if (age < 30 * 60 * 1000) {
          setInfo(data.info || info)
          setShipping(data.shipping || 0)
          setCustomerCoords(data.customerCoords || null)
          setDeliveryInfo(data.deliveryInfo || null)
          setActiveStep(data.activeStep || "information")
          toast.success("Welcome back! Your checkout is ready.")
          localStorage.removeItem("checkout_redirect_data")
        }
      }
    } catch (error) {
      console.error("Failed to restore checkout data:", error)
    }
  }, [isHydrated])

  // Auto-save checkout data
  useEffect(() => {
    if (!isHydrated) return
    const saveToStorage = () => {
      try {
        localStorage.setItem(
          CHECKOUT_STORAGE_KEY,
          JSON.stringify({ info, activeStep, shipping, customerCoords, deliveryInfo }),
        )
      } catch (error) {
        console.error("Failed to save checkout data to localStorage:", error)
      }
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(saveToStorage, 500)
    const handleVisibility = () => { if (document.visibilityState === "hidden") saveToStorage() }
    const handleBeforeUnload = () => saveToStorage()
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [info, activeStep, shipping, customerCoords, deliveryInfo, isHydrated])

  const handlePaymentCallback = async (reference: string) => {
    setIsProcessing(true)
    try {
      const verifyResponse = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reference }),
      })
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to verify payment")
      }
      const verifyData = await verifyResponse.json()
      const paystackStatus = verifyData?.data?.status || verifyData?.status
      if (paystackStatus === "abandoned" || paystackStatus === "cancelled" || paystackStatus === "failed") {
        sessionStorage.setItem("checkout_cancelled_message", "Payment was not completed. You can try again.")
        window.location.replace("/checkout")
        return
      }
      clearCart()
      localStorage.removeItem(CHECKOUT_STORAGE_KEY)
      localStorage.removeItem("checkout_redirect_data")
      sessionStorage.removeItem("pending_payment_reference")
      toast.success("Payment successful! Your order has been placed.")
      router.push(`/checkout/payment-success?reference=${reference}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to verify payment"
      console.error("Payment verification error:", errorMessage)
      sessionStorage.setItem("checkout_cancelled_message", errorMessage)
      window.location.replace("/checkout")
    }
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentReference = urlParams.get("reference") || urlParams.get("trxref")
    if (!paymentReference) {
      setIsInitializing(false)
      setIsProcessing(false)
      sessionStorage.removeItem("paystack_redirect_initiated")
      const pendingMessage = sessionStorage.getItem("checkout_cancelled_message")
      if (pendingMessage) {
        sessionStorage.removeItem("checkout_cancelled_message")
        setTimeout(() => toast.error(pendingMessage), 100)
      }
      return
    }
    const wasRedirected = sessionStorage.getItem("paystack_redirect_initiated")
    if (!wasRedirected) { window.location.replace("/checkout"); return }
    sessionStorage.removeItem("paystack_redirect_initiated")
    handlePaymentCallback(paymentReference)
  }, [])

  const handlePayNow = async () => {
    setIsInitializing(true)
    try {
      if (
        !Number.isFinite(Number(customerCoords?.lat)) ||
        !Number.isFinite(Number(customerCoords?.lng))
      ) {
        toast.error("Please confirm your delivery location on the map before payment")
        setActiveStep("information")
        setIsInitializing(false)
        return
      }

      const userResponse = await fetch("/api/me", { credentials: "include", headers: { "Content-Type": "application/json" } })
      const userData = await userResponse.json()
      if (!userResponse.ok || !userData.user) {
        try {
          localStorage.setItem(
            "checkout_redirect_data",
            JSON.stringify({ info, shipping, activeStep, customerCoords, deliveryInfo, timestamp: Date.now() }),
          )
        } catch {}
        toast.error("Please log in to complete your purchase")
        router.push("/auth/login?redirect=/checkout")
        setIsInitializing(false)
        return
      }
      const userId = userData.user._id || userData.user.id
      if (!userId) {
        toast.error("User ID not found. Please log in again.")
        router.push("/auth/login?redirect=/checkout")
        setIsInitializing(false)
        return
      }
      const groupedByStore: Record<string, typeof cartItems> = {}
      cartItems.forEach((item) => {
        if (!groupedByStore[item.storeId]) groupedByStore[item.storeId] = []
        groupedByStore[item.storeId].push(item)
      })
      const orders = Object.entries(groupedByStore).map(([storeId, storeItems]) => ({
        storeId,
        items: storeItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }))
      const initResponse = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: info.email,
          amount: total,
          type: "checkout",
          orders,
          shippingInfo: {
            firstName: info.firstName, lastName: info.lastName, email: info.email,
            address: info.address,
            state: info.state,
            phone: info.phone || "Not provided",
            area: info.area || info.state || "Not provided",
            customerCoords: customerCoords || undefined,
          },
          deliveryFee: shipping,
          paymentMethod: "card",
          userId,
        }),
      })
      const initData = await initResponse.json()
      if (!initResponse.ok) {
        toast.error(initData.error || "Failed to initialize payment")
        setIsInitializing(false)
        return
      }
      sessionStorage.setItem("pending_payment_reference", initData.reference)
      sessionStorage.setItem("paystack_redirect_initiated", "true")
      localStorage.removeItem("checkout_redirect_data")
      setIsInitializing(false)
      window.location.href = initData.authorization_url
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize payment"
      console.error("Payment initialization error:", errorMessage)
      toast.error(errorMessage)
      setIsInitializing(false)
    }
  }

  const handleContinue = () => {
    if (activeStep === "information" && isInfoValid) {
      setActiveStep("payment")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleBack = () => {
    if (activeStep === "payment") {
      setActiveStep("information")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const calculateDeliveryFromCoords = useCallback(async (coords: { lat: number; lng: number }) => {
    const storeIds = [...new Set(cartItems.map((item) => item.storeId))].filter(Boolean)
    const productIds = [
      ...new Set(cartItems.map((item) => item.productId || item.id).filter(Boolean)),
    ]
    if (storeIds.length === 0 && productIds.length === 0) {
      setShipping(0)
      setDeliveryInfo(null)
      return
    }
    setIsCalculatingFee(true)
    try {
      const params = new URLSearchParams()
      if (storeIds.length > 0) params.set("ids", storeIds.join(","))
      if (productIds.length > 0) params.set("productIds", productIds.join(","))

      const res = await fetch(`/api/stores/coordinates?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch store locations")
      const data = await res.json()
      const storesWithCoords = (data.stores || []).filter(
        (s: any) => s.coordinates?.length === 2 && !(s.coordinates[0] === 0 && s.coordinates[1] === 0)
      )
      if (storesWithCoords.length === 0) {
        setShipping(2000); setDeliveryInfo({ distanceKm: 0, tierLabel: "Flat rate" }); return
      }
      const result = calculateMaxDeliveryFee(
        storesWithCoords.map((s: any) => ({ coordinates: s.coordinates })), coords.lat, coords.lng
      )
      setShipping(result.fee)
      setDeliveryInfo({ distanceKm: result.distanceKm, tierLabel: result.tierLabel })
    } catch {
      setShipping(2000); setDeliveryInfo({ distanceKm: 0, tierLabel: "Flat rate (fallback)" })
    } finally { setIsCalculatingFee(false) }
  }, [cartItems])

  const handleAddressSelect = (coords: { lat: number; lng: number } | null) => {
    setCustomerCoords(coords)
    if (coords) { calculateDeliveryFromCoords(coords) }
    else { setShipping(0); setDeliveryInfo(null) }
  }

  useEffect(() => {
    if (!isHydrated || !customerCoords || cartItems.length === 0) return
    calculateDeliveryFromCoords(customerCoords)
  }, [isHydrated, customerCoords, cartItems.length, calculateDeliveryFromCoords])

  const hasDeliveryCoords =
    Number.isFinite(Number(customerCoords?.lat)) &&
    Number.isFinite(Number(customerCoords?.lng))
  const isInfoValid = info.firstName.trim() && info.lastName.trim() && info.email.trim() && info.address.trim() && info.state.trim() && hasDeliveryCoords
  const subtotal = getTotalPrice()
  const total = subtotal + shipping
  const disabled = isProcessing || isInitializing
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const summaryProps = {
    cartItems,
    subtotal,
    shipping,
    total,
    formatAmount,
    updateQuantity,
    removeFromCart,
    getCartItemKey,
    disabled,
    activeStep,
    deliveryPending: !hasDeliveryCoords,
  }

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (cartItems.length === 0 && !isProcessing) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <div className="mx-auto max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">Your cart is empty</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Add some items to your cart before checking out.
          </p>
          <button
            type="button"
            onClick={() => router.push("/stores")}
            className={cn(primaryBtn, "w-full")}
          >
            Start shopping
          </button>
        </div>
      </div>
    )
  }

  // ── Checkout ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Processing overlay */}
      {isProcessing && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="mx-4 max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-xl">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#0E5A43] dark:text-emerald-400" />
            <h3 className="mb-1 text-base font-semibold">Verifying payment</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your payment...
            </p>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/allStoreProducts")}
              disabled={disabled}
              className={cn(
                "-ml-1 flex items-center gap-1.5 rounded p-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
                focusRing,
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to shop</span>
            </button>

            <h1 className="flex items-center gap-2 text-sm font-semibold">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Checkout
            </h1>

            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Secure</span>
            </span>
          </div>

          <Steps
            activeStep={activeStep}
            infoValid={!!isInfoValid}
            disabled={disabled}
            onSelect={setActiveStep}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-12">
          {/* ── Order summary (mobile: collapsible, closed by default) ────── */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setShowOrderSummary((v) => !v)}
              aria-expanded={showOrderSummary}
              aria-controls="mobile-order-summary"
              className={cn(
                "flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm",
                focusRing,
              )}
            >
              <span className="flex items-center gap-2 font-medium text-[#0E5A43] dark:text-emerald-400">
                <Package className="h-4 w-4" />
                {showOrderSummary ? "Hide" : "Show"} order summary
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", showOrderSummary && "rotate-180")}
                />
              </span>
              <span className="font-semibold tabular-nums">{formatAmount(total)}</span>
            </button>

            <div
              id="mobile-order-summary"
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                showOrderSummary ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="min-h-0 overflow-hidden" aria-hidden={!showOrderSummary}>
                <div className="pt-3">
                  <OrderSummaryContent {...summaryProps} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Main column ───────────────────────────────────────────────── */}
          <div className="space-y-8 lg:col-span-3">
            {activeStep === "information" && (
              <>
                {/* Contact */}
                <section aria-labelledby="contact-heading" className="space-y-4">
                  <h2 id="contact-heading" className="text-lg font-semibold tracking-tight">
                    Contact
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field id="firstName" label="First name" required autoComplete="given-name" value={info.firstName} onChange={(v) => setInfo({ ...info, firstName: v })} disabled={disabled} />
                    <Field id="lastName" label="Last name" required autoComplete="family-name" value={info.lastName} onChange={(v) => setInfo({ ...info, lastName: v })} disabled={disabled} />
                  </div>
                  <Field id="email" label="Email" required type="email" autoComplete="email" value={info.email} onChange={(v) => setInfo({ ...info, email: v })} disabled={disabled} />
                  <Field id="phone" label="Phone" type="tel" inputMode="tel" autoComplete="tel" value={info.phone} onChange={(v) => setInfo({ ...info, phone: v })} disabled={disabled} />
                </section>

                {/* Delivery */}
                <section aria-labelledby="delivery-heading" className="space-y-4 border-t border-border pt-8">
                  <h2 id="delivery-heading" className="text-lg font-semibold tracking-tight">
                    Delivery
                  </h2>

                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="text-sm font-medium">
                      State <span className="text-muted-foreground">*</span>
                    </Label>
                    <select
                      id="state"
                      value={info.state}
                      onChange={(e) => setInfo({ ...info, state: e.target.value })}
                      className="h-11 w-full rounded-lg border border-border bg-background px-3 text-base outline-none transition-colors focus:border-[#0E5A43] focus:ring-4 focus:ring-[#0E5A43]/10 disabled:opacity-60 sm:text-sm"
                      disabled={disabled}
                    >
                      <option value="">Select a state</option>
                      <option value="Enugu">Enugu</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      Delivery address <span className="text-muted-foreground">*</span>
                    </Label>
                    <MapAddressPicker
                      value={info.address}
                      onChange={(address) => setInfo({ ...info, address })}
                      onSelect={handleAddressSelect}
                      placeholder="Tap to pick your delivery address on map"
                    />
                    {!hasDeliveryCoords && (
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Confirm the delivery pin on the map to calculate delivery and continue.
                      </p>
                    )}
                  </div>

                  {isCalculatingFee && (
                    <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground" role="status">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Calculating delivery fee...
                    </div>
                  )}
                  {deliveryInfo && !isCalculatingFee && (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Truck className="h-4 w-4 text-[#0E5A43] dark:text-emerald-400" />
                        <div>
                          <p className="text-sm font-medium">Delivery fee</p>
                          {deliveryInfo.distanceKm > 0 && (
                            <p className="text-xs text-muted-foreground">
                              ~{deliveryInfo.distanceKm} km &middot; {deliveryInfo.tierLabel}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatAmount(shipping)}
                      </span>
                    </div>
                  )}
                </section>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!isInfoValid || disabled}
                    className={cn(primaryBtn, "w-full gap-1.5")}
                  >
                    Continue to payment
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {activeStep === "payment" && (
              <>
                {/* Review */}
                <section aria-labelledby="review-heading" className="space-y-3">
                  <h2 id="review-heading" className="text-lg font-semibold tracking-tight">
                    Review
                  </h2>
                  <div className="divide-y divide-border rounded-lg border border-border">
                    <ReviewRow label="Contact" onEdit={handleBack} disabled={disabled}>
                      <p>{info.email}</p>
                      {info.phone && <p className="text-muted-foreground">{info.phone}</p>}
                    </ReviewRow>
                    <ReviewRow label="Deliver to" onEdit={handleBack} disabled={disabled}>
                      <p>
                        {info.firstName} {info.lastName}
                      </p>
                      <p className="text-muted-foreground">{info.address}</p>
                    </ReviewRow>
                  </div>
                </section>

                {/* Payment method */}
                <section
                  aria-labelledby="payment-heading"
                  className="space-y-3 border-t border-border pt-8"
                >
                  <h2 id="payment-heading" className="text-lg font-semibold tracking-tight">
                    Payment
                  </h2>
                  <div className="flex items-center gap-4 rounded-lg border-2 border-[#0E5A43] bg-[#0E5A43]/[0.03] p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
                      <Image
                        src="/paystack.jpeg"
                        alt="Paystack"
                        width={36}
                        height={36}
                        className="object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">Paystack</p>
                      <p className="text-xs text-muted-foreground">Card, bank transfer, or USSD</p>
                    </div>
                    <span
                      aria-hidden
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0E5A43] text-white"
                    >
                      <Check className="h-3 w-3" />
                    </span>
                  </div>

                  <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Your payment is processed securely by Paystack. We never store your card
                    details, and all prices are verified on our servers.
                  </p>
                </section>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={disabled}
                    className={cn(secondaryBtn, "gap-1.5")}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handlePayNow}
                    disabled={disabled}
                    className={cn(primaryBtn, "flex-1 gap-2")}
                  >
                    {isInitializing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Initializing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" /> Pay {formatAmount(total)}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Order summary (desktop sidebar) ──────────────────────────── */}
          <aside className="hidden lg:col-span-2 lg:block" aria-label="Order summary">
            <div className="sticky top-28">
              <OrderSummaryContent {...summaryProps} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Steps({
  activeStep, infoValid, disabled, onSelect,
}: {
  activeStep: "information" | "payment"
  infoValid: boolean
  disabled: boolean
  onSelect: (step: "information" | "payment") => void
}) {
  const detailsDone = infoValid && activeStep === "payment"

  const stepClass = (active: boolean) =>
    cn(
      "flex items-center gap-2 rounded px-1 py-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
      active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
      focusRing,
    )

  const bubble = (active: boolean, done: boolean, n: number) => (
    <span
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
        active || done ? "bg-[#0E5A43] text-white" : "bg-muted text-muted-foreground",
      )}
    >
      {done ? <Check className="h-3 w-3" /> : n}
    </span>
  )

  return (
    <nav aria-label="Checkout steps" className="pb-3">
      <ol className="flex items-center justify-center gap-3">
        <li>
          <button
            type="button"
            onClick={() => !disabled && onSelect("information")}
            aria-current={activeStep === "information" ? "step" : undefined}
            className={stepClass(activeStep === "information")}
          >
            {bubble(activeStep === "information", detailsDone, 1)}
            Details
          </button>
        </li>
        <li aria-hidden className="h-px w-8 bg-border sm:w-12" />
        <li>
          <button
            type="button"
            onClick={() => infoValid && !disabled && onSelect("payment")}
            disabled={!infoValid}
            aria-current={activeStep === "payment" ? "step" : undefined}
            className={stepClass(activeStep === "payment")}
          >
            {bubble(activeStep === "payment", false, 2)}
            Payment
          </button>
        </li>
      </ol>
    </nav>
  )
}

function Field({
  id, label, value, onChange, required, type = "text", disabled, autoComplete, inputMode,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: string
  disabled?: boolean
  autoComplete?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span className="text-muted-foreground"> *</span>
        ) : (
          <span className="font-normal text-muted-foreground"> (optional)</span>
        )}
      </Label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-11 rounded-lg border-border bg-background text-base shadow-none transition-colors focus-visible:border-[#0E5A43] focus-visible:ring-4 focus-visible:ring-[#0E5A43]/10 focus-visible:ring-offset-0 sm:text-sm"
      />
    </div>
  )
}

function ReviewRow({
  label, children, onEdit, disabled,
}: {
  label: string
  children: React.ReactNode
  onEdit: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start gap-4 px-4 py-3 text-sm">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1 space-y-0.5 break-words">{children}</div>
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className={cn(
          "shrink-0 rounded text-sm font-medium text-[#0E5A43] hover:underline dark:text-emerald-400",
          focusRing,
        )}
      >
        Edit
      </button>
    </div>
  )
}

// "Soup: Egusi · Meat: Beef, Fish": add-ons picked on the product page
function getAddOnText(item: any): string {
  const raw = item?.selectedModifiers
  if (!Array.isArray(raw)) return ""
  return raw
    .filter((g: any) => g && Array.isArray(g.options) && g.options.length > 0)
    .map((g: any) => `${g.groupName}: ${g.options.map((o: any) => o.name).join(", ")}`)
    .join(" · ")
}

function OrderSummaryContent({
  cartItems, subtotal, shipping, total, formatAmount, updateQuantity, removeFromCart,
  getCartItemKey, disabled, activeStep, deliveryPending,
}: {
  cartItems: any[]
  subtotal: number
  shipping: number
  total: number
  formatAmount: (n: number) => string
  updateQuantity: (id: string, qty: number, key?: string) => void
  removeFromCart: (id: string, key?: string) => void
  getCartItemKey: (id: string, variant?: any, modifiers?: any) => string
  disabled: boolean
  activeStep: string
  deliveryPending: boolean
}) {
  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold">Order summary</h3>
        <span className="text-xs text-muted-foreground">
          {count} {count === 1 ? "item" : "items"}
        </span>
      </div>

      <ul className="divide-y divide-border px-5 lg:max-h-[22rem] lg:overflow-y-auto">
        {cartItems.map((item) => {
          // Same key the cart uses, so the right variant / add-on combination is changed
          const itemKey = getCartItemKey(item.id, item.selectedVariant, item.selectedModifiers)
          const addOns = getAddOnText(item)
          const color = item.selectedVariant?.color
          const size = item.selectedVariant?.size

          return (
            <li key={itemKey} className="flex gap-3 py-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                <Image
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatAmount(item.price * item.quantity)}
                  </p>
                </div>

                {(color || size) && (
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    {color && (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          aria-hidden
                          className="h-2.5 w-2.5 rounded-full border border-black/15"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                      </span>
                    )}
                    {color && size && <span aria-hidden>·</span>}
                    {size && <span>Size {size}</span>}
                  </p>
                )}

                {addOns && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground" title={addOns}>
                    {addOns}
                  </p>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <div
                    className="inline-flex h-7 items-center rounded-md border border-border"
                    role="group"
                    aria-label={`Quantity of ${item.name}`}
                  >
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => updateQuantity(item.id, item.quantity - 1, itemKey)}
                      disabled={item.quantity <= 1 || disabled}
                      className="flex h-7 w-7 items-center justify-center rounded-l-md transition-colors hover:bg-muted disabled:opacity-40"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="min-w-[1.75rem] text-center text-xs font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => updateQuantity(item.id, item.quantity + 1, itemKey)}
                      disabled={disabled}
                      className="flex h-7 w-7 items-center justify-center rounded-r-md transition-colors hover:bg-muted disabled:opacity-40"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeFromCart(item.id, itemKey)}
                    disabled={disabled}
                    className="rounded text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <dl className="space-y-2 border-t border-border px-5 py-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{formatAmount(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Delivery</dt>
          <dd className={cn("tabular-nums", deliveryPending && shipping === 0 && "text-muted-foreground")}>
            {shipping > 0 ? formatAmount(shipping) : deliveryPending ? "Add address" : formatAmount(0)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <dt className="text-base font-semibold">Total</dt>
          <dd className="text-xl font-semibold tabular-nums">{formatAmount(total)}</dd>
        </div>
      </dl>

      {activeStep === "payment" && (
        <p className="border-t border-border bg-amber-50/60 px-5 py-3 text-xs text-amber-800 dark:bg-amber-950/10 dark:text-amber-300">
          The final amount is checked against current prices when you pay.
        </p>
      )}
    </div>
  )
}