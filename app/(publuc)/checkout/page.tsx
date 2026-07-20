"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  ShoppingBag, MapPin, ChevronRight, Shield, ArrowLeft, Trash2,
  Package, CreditCard, Minus, Plus, Lock, CheckCircle, Loader2,
  ChevronDown, User, Mail, Phone as PhoneIcon, MapPinned, Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { MapAddressPicker } from "@/components/ui/map-address-picker"
import { useCart } from "@/context/cart-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useFormatAmount } from "@/hooks/useFormatAmount"
import { Badge } from "@/components/ui/badge"
import { calculateMaxDeliveryFee, DELIVERY_TIERS } from "@/lib/delivery-fee"

const CHECKOUT_STORAGE_KEY = "checkout_form_data"

export default function CheckoutPage() {
  const router = useRouter()
  const { items: cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart()
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
      console.log("Payment verified successfully, clearing cart...")
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
      if (!initResponse.ok) throw new Error(initData.error || "Failed to initialize payment")
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

  // ── Empty cart ─────────────────────────────────────────────────────────────
  if (cartItems.length === 0 && !isProcessing) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-muted/60 flex items-center justify-center">
            <ShoppingBag className="h-9 w-9 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-sm text-muted-foreground mb-6">Add some items to your cart before checking out.</p>
          <Button onClick={() => router.push("/stores")} size="lg" className="rounded-xl h-12 w-full">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Start Shopping
          </Button>
        </div>
      </div>
    )
  }

  // ── Checkout ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Processing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border/50 rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
            <h3 className="text-lg font-bold mb-1">Verifying Payment</h3>
            <p className="text-sm text-muted-foreground">Please wait while we confirm your payment...</p>
          </div>
        </div>
      )}

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <button
              type="button"
              onClick={() => router.push("/allStoreProducts")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1"
              disabled={disabled}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Shop</span>
            </button>
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold">Checkout</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span className="hidden sm:inline">Secured</span>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex items-center justify-center gap-0 pb-3 ">
            <StepPill
              step={1}
              label="Details"
              isActive={activeStep === "information"}
              isComplete={!!isInfoValid && activeStep === "payment"}
              onClick={() => !disabled && setActiveStep("information")}
            />
            <div className="flex-shrink-0 w-6 sm:w-10 flex items-center justify-center">
              <div className={cn("h-px w-full", isInfoValid ? "bg-primary" : "bg-border")} />
            </div>
            <StepPill
              step={2}
              label="Pay"
              isActive={activeStep === "payment"}
              isComplete={false}
              onClick={() => isInfoValid && !disabled && setActiveStep("payment")}
              disabled={!isInfoValid}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

          {/* ── Order summary (mobile inline - top) ───────────────────────── */}
          <div className="lg:hidden">
            <SectionTitle icon={Package} title="Order Summary" />
            <div className="mt-3">
              <OrderSummaryContent
                cartItems={cartItems}
                subtotal={subtotal}
                shipping={shipping}
                total={total}
                formatAmount={formatAmount}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                disabled={disabled}
                activeStep={activeStep}
              />
            </div>
          </div>

          {/* ── Main column ──────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-5">

            {activeStep === "information" && (
              <>
                {/* Contact info */}
                <AnimatedContainer animation="fadeIn">
                  <div className="space-y-4">
                    <SectionTitle icon={User} title="Contact" />
                    <div className="grid grid-cols-2 gap-3">
                      <FloatingInput label="First Name" required value={info.firstName} onChange={(v) => setInfo({ ...info, firstName: v })} disabled={disabled} />
                      <FloatingInput label="Last Name" required value={info.lastName} onChange={(v) => setInfo({ ...info, lastName: v })} disabled={disabled} />
                    </div>
                    <FloatingInput label="Email" required type="email" value={info.email} onChange={(v) => setInfo({ ...info, email: v })} disabled={disabled} />
                    <FloatingInput label="Phone" type="tel" value={info.phone} onChange={(v) => setInfo({ ...info, phone: v })} disabled={disabled} />
                  </div>
                </AnimatedContainer>

                <Separator className="my-1" />

                {/* Delivery */}
                <AnimatedContainer animation="fadeIn" delay={0.05}>
                  <div className="space-y-4">
                    <SectionTitle icon={MapPinned} title="Delivery" />
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">State *</Label>
                      <select
                        value={info.state}
                        onChange={(e) => setInfo({ ...info, state: e.target.value })}
                        className="w-full h-12 rounded-xl border border-border/60 px-3 text-sm bg-background focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                        disabled={disabled}
                      >
                        <option value="">Select a state</option>
                        <option value="Enugu">Enugu</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Delivery Address *</Label>
                      <MapAddressPicker
                        value={info.address}
                        onChange={(address) => setInfo({ ...info, address })}
                        onSelect={handleAddressSelect}
                        placeholder="Tap to pick your delivery address on map"
                      />
                      {!hasDeliveryCoords && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Confirm the delivery pin on the map to calculate delivery and continue.
                        </p>
                      )}
                    </div>

                    {/* Delivery fee */}
                    {isCalculatingFee && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Calculating delivery fee...
                      </div>
                    )}
                    {deliveryInfo && !isCalculatingFee && (
                      <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Delivery Fee</p>
                            {deliveryInfo.distanceKm > 0 && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                ~{deliveryInfo.distanceKm} km &middot; {deliveryInfo.tierLabel}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                          {formatAmount(shipping)}
                        </span>
                      </div>
                    )}
                  </div>
                </AnimatedContainer>

                {/* Continue button */}
                <div className="pt-2">
                  <Button
                    onClick={handleContinue}
                    className="w-full rounded-xl text-base font-semibold shadow-lg active:scale-[0.98] transition-all"
                    disabled={!isInfoValid || disabled}
                    size="lg"
                  >
                    Continue to Payment
                    <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {activeStep === "payment" && (
              <>
                {/* Review info */}
                <AnimatedContainer animation="fadeIn">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full text-left rounded-xl border border-border/50 p-3.5 sm:p-4 hover:border-primary/30 transition-colors group"
                    disabled={disabled}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Delivering to</span>
                      <span className="text-xs text-primary font-medium group-hover:underline">Edit</span>
                    </div>
                    <p className="text-sm font-medium">{info.firstName} {info.lastName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{info.address}</p>
                    {info.phone && <p className="text-xs text-muted-foreground mt-0.5">{info.phone}</p>}
                  </button>
                </AnimatedContainer>

                {/* Payment method */}
                <AnimatedContainer animation="fadeIn" delay={0.05}>
                  <div className="space-y-3">
                    <SectionTitle icon={CreditCard} title="Payment" />
                    <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.02] p-4 flex items-center gap-4">
                      <div className="h-11 w-11 rounded-lg overflow-hidden flex-shrink-0 bg-white flex items-center justify-center border">
                        <Image src="/paystack.jpeg" alt="Paystack" width={36} height={36} className="object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">Paystack</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Card, bank transfer, or USSD</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] gap-1 border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                        <Shield className="h-2.5 w-2.5" />
                        Secure
                      </Badge>
                    </div>
                  </div>
                </AnimatedContainer>

                {/* Security note */}
                <AnimatedContainer animation="fadeIn" delay={0.1}>
                  <div className="flex items-start gap-2.5 rounded-xl bg-muted/40 px-3.5 py-3">
                    <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                      Your payment is processed securely by Paystack. We never store your card details. All prices are verified server-side.
                    </p>
                  </div>
                </AnimatedContainer>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="h-13 rounded-xl border-border/60 px-5"
                    disabled={disabled}
                  >
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={handlePayNow}
                    className="flex-1 h-13 rounded-xl text-base font-semibold shadow-lg active:scale-[0.98] transition-all"
                    disabled={disabled}
                  >
                    {isInitializing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...</>
                    ) : (
                      <><Lock className="mr-2 h-4 w-4" /> Pay {formatAmount(total)}</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* ── Order summary (desktop sidebar) ──────────────────────────── */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-28">
              <OrderSummaryContent
                cartItems={cartItems}
                subtotal={subtotal}
                shipping={shipping}
                total={total}
                formatAmount={formatAmount}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                disabled={disabled}
                activeStep={activeStep}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ───────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/40 lg:hidden">
        <div className="px-4 py-3 space-y-2">
          {/* Expandable summary */}
          <button
            type="button"
            onClick={() => setShowOrderSummary(!showOrderSummary)}
            className="w-full flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              {cartItems.length} item{cartItems.length > 1 ? "s" : ""}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showOrderSummary && "rotate-180")} />
            </span>
            <span className="font-bold text-base">{formatAmount(total)}</span>
          </button>

          {showOrderSummary && (
            <div className="max-h-[40vh] overflow-y-auto border-t border-border/30 pt-3 space-y-3">
              {cartItems.map((item) => (
                <div key={`m-${item.id}`} className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-semibold">{formatAmount(item.price * item.quantity)}</span>
                </div>
              ))}
              <Separator />
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatAmount(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-medium">{formatAmount(shipping)}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StepPill({
  step, label, isActive, isComplete, onClick, disabled,
}: {
  step: number; label: string; isActive: boolean; isComplete: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all disabled:opacity-40",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : isComplete
            ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
            : "text-muted-foreground"
      )}
    >
      {isComplete ? (
        <CheckCircle className="h-3.5 w-3.5" />
      ) : (
        <span className={cn(
          "h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center",
          isActive ? "bg-primary-foreground/20" : "bg-muted"
        )}>{step}</span>
      )}
      {label}
    </button>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  )
}

function FloatingInput({
  label, value, onChange, required, type = "text", disabled,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}{required && " *"}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-xl border-border/60 focus:border-primary focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:ring-offset-0 text-sm transition-all"
        disabled={disabled}
      />
    </div>
  )
}

function OrderSummaryContent({
  cartItems, subtotal, shipping, total, formatAmount, updateQuantity, removeFromCart, disabled, activeStep,
}: {
  cartItems: any[]; subtotal: number; shipping: number; total: number;
  formatAmount: (n: number) => string; updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void; disabled: boolean; activeStep: string;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Order Summary</h3>
          <Badge variant="secondary" className="text-[10px]">{cartItems.length} items</Badge>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3 lg:max-h-[320px] lg:overflow-y-auto">
        {cartItems.map((item) => (
          <div
            key={`d-${item.id}-${item.selectedVariant?.color?.hex || ""}-${item.selectedVariant?.size || ""}`}
            className="flex gap-3 group"
          >
            <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/30">
              <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-tight line-clamp-2">{item.name}</p>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  disabled={disabled}
                  className="text-muted-foreground hover:text-destructive transition-colors lg:opacity-0 lg:group-hover:opacity-100 p-0.5 flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {item.selectedVariant && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {item.selectedVariant.color && (
                    <>
                      <div className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: item.selectedVariant.color.hex }} />
                      <span className="text-[10px] text-muted-foreground">{item.selectedVariant.color.name}</span>
                    </>
                  )}
                  {item.selectedVariant.size && (
                    <span className="text-[10px] text-muted-foreground">{item.selectedVariant.color ? " / " : ""}Size: {item.selectedVariant.size}</span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center rounded-lg border border-border/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1 || disabled}
                    className="h-6 w-6 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className="px-2 text-[10px] font-bold min-w-[1.5rem] text-center">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={disabled}
                    className="h-6 w-6 flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>
                <span className="text-sm font-semibold">{formatAmount(item.price * item.quantity)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border/30 px-5 py-4 space-y-2.5 bg-muted/20">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatAmount(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Delivery</span>
          <span className="font-medium">{shipping > 0 ? formatAmount(shipping) : "---"}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-xl font-bold text-primary">{formatAmount(total)}</span>
        </div>
      </div>

      {activeStep === "payment" && (
        <div className="border-t border-border/30 px-5 py-3 bg-amber-50/50 dark:bg-amber-950/10">
          <p className="text-[10px] text-amber-700 dark:text-amber-300">
            Final amount will be validated against current prices when you click Pay.
          </p>
        </div>
      )}
    </div>
  )
}
