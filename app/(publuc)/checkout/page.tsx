"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ShoppingBag, MapPin, ChevronRight, Shield, ArrowLeft, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { FormSection } from "@/components/ui/form-section"
import { useCart } from "@/context/cart-context"
import { PaystackButton } from "@/components/paystack-button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useFormatAmount } from "@/hooks/useFormatAmount"

const CHECKOUT_STORAGE_KEY = "checkout_form_data"

export default function CheckoutPage() {
  const router = useRouter()
  const { items: cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart()
  const [activeStep, setActiveStep] = useState<"information" | "payment">("information")
  const [isProcessing, setIsProcessing] = useState(false)
  const [shipping, setShipping] = useState(0)
  const [isPaystackOpen, setIsPaystackOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { formatAmount } = useFormatAmount();

  // Form state for information step
  const [info, setInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    state: "",
    phone: "",
    area: "",
  })

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(CHECKOUT_STORAGE_KEY)
      if (savedData) {
        const { info: savedInfo, activeStep: savedStep, shipping: savedShipping } = JSON.parse(savedData)
        setInfo(
          savedInfo || {
            firstName: "",
            lastName: "",
            email: "",
            address: "",
            state: "",
            phone: "",
            area: "",
          },
        )
        setActiveStep(savedStep || "information")
        setShipping(savedShipping || 0)
      }
    } catch (error) {
      console.error("Failed to load checkout data from localStorage:", error)
      localStorage.removeItem(CHECKOUT_STORAGE_KEY)
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    // helper to save immediately
    const saveToStorage = () => {
      try {
        const dataToSave = { info, activeStep, shipping }
        localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(dataToSave))
      } catch (error) {
        console.error("Failed to save checkout data to localStorage:", error)
      }
    }

    // Debounced save (500ms)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(saveToStorage, 500)

    // Save on visibility change (when tab hidden) and beforeunload to ensure persistence on refresh/close
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") saveToStorage()
    }
    const handleBeforeUnload = () => {
      saveToStorage()
    }
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [info, activeStep, shipping, isHydrated])

  // Validation for required fields
  const isInfoValid =
    info.firstName.trim() &&
    info.lastName.trim() &&
    info.email.trim() &&
    info.address.trim() &&
    info.state.trim() &&
    info.area.trim()

  // Calculate totals
  const subtotal = getTotalPrice()
  const total = subtotal + shipping

  const handlePaymentSuccess = async (reference: string) => {
    setIsProcessing(true)
    setIsPaystackOpen(false)
    try {
      // Group items by storeId
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

      console.log("[v0] Verifying payment with reference:", reference)

      const verifyResponse = await fetch("/api/paystack/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reference,
          orderData,
        }),
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] Verification failed:", errorData)
        throw new Error(errorData.error || "Failed to verify payment")
      }

      const verifyData = await verifyResponse.json()
      console.log("[v0] Payment verified successfully:", verifyData)

      localStorage.removeItem(CHECKOUT_STORAGE_KEY)
      clearCart()
      toast.success("Payment successful! Your order has been placed.")

      router.push(`/checkout/confirmation?reference=${reference}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to verify payment"
      console.error("[v0] Payment error:", errorMessage)
      toast.error(errorMessage)
      setIsProcessing(false)
    }
  }

  const handlePaymentClose = () => {
    setIsPaystackOpen(false)
    setIsProcessing(false)
    toast.info("Payment cancelled")
  }

  // Step navigation
  const handleContinue = () => {
    if (activeStep === "information") {
      if (isInfoValid) setActiveStep("payment")
    }
  }

  const handleBack = () => {
    if (activeStep === "payment") {
      setActiveStep("information")
    }
  }

  // Handle change for delivery area
  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedArea = e.target.value
    setInfo({ ...info, area: selectedArea })

    // Map delivery charges
    switch (selectedArea) {
      case "Enugu":
        setShipping(5000)
        break
      case "Nsukka":
        setShipping(3000)
        break
      case "Enugu Ezike":
        setShipping(2000)
        break
      default:
        setShipping(0)
    }
  }

  // If cart is empty, redirect to cart page
  if (cartItems.length === 0) {
    return (
      <div className="container px-4 py-20 max-w-[1280px] mx-auto text-center">
        <div className="max-w-md mx-auto">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some items to your cart before checking out.</p>
          <Button onClick={() => router.push("/stores")} className="w-full">
            Continue Shopping
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">

      <div className="container px-4 py-10 max-w-[1280px] mx-auto">
        <AnimatedContainer animation="fadeIn" className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/stores")} className="mb-4 hover:bg-muted/50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue shopping
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Secure Checkout
            </h1>
          </div>
        </AnimatedContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Tabs value={activeStep} className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger
                  value="information"
                  className={cn(
                    "flex items-center gap-2 rounded-lg transition-all duration-200",
                    "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                  )}
                  onClick={() => setActiveStep("information")}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                        activeStep === "information"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      1
                    </div>
                    <span className="hidden sm:inline">Information</span>
                    <span className="sm:hidden">Info</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className={cn(
                    "flex items-center gap-2 rounded-lg transition-all duration-200",
                    "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                  )}
                  onClick={() => setActiveStep("payment")}
                  disabled={!isInfoValid}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                        activeStep === "payment"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      2
                    </div>
                    <span className="hidden sm:inline">Payment</span>
                    <span className="sm:hidden">Pay</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="information" className="space-y-6 mt-0">
                <AnimatedContainer animation="fadeIn">
                  <FormSection
                    title="Contact Information"
                    description="We'll use this to send your order confirmation"
                    icon={ShoppingBag}
                  >
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            placeholder="Kingsley"
                            value={info.firstName}
                            onChange={(e) => setInfo({ ...info, firstName: e.target.value })}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            placeholder="Mamah"
                            value={info.lastName}
                            onChange={(e) => setInfo({ ...info, lastName: e.target.value })}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john.doe@example.com"
                          value={info.email}
                          onChange={(e) => setInfo({ ...info, email: e.target.value })}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                          id="phone"
                          placeholder="08012345678"
                          value={info.phone}
                          onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </FormSection>
                </AnimatedContainer>

                <AnimatedContainer animation="fadeIn" delay={0.1}>
                  <FormSection title="Delivery Address" description="Where should we send your order?" icon={MapPin}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <select
                          id="state"
                          value={info.state}
                          onChange={(e) => setInfo({ ...info, state: e.target.value })}
                          className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-transparent"
                        >
                          <option className="bg-transparent text-black" value="">
                            Select a state
                          </option>
                          <option className="bg-transparent text-black" value="Enugu">
                            Enugu
                          </option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area">Delivery Area *</Label>
                        <select
                          id="area"
                          value={info.area}
                          onChange={handleAreaChange}
                          className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all duration-200 bg-transparent"
                        >
                          <option className="bg-transparent text-black" value="">
                            Select delivery area
                          </option>
                          <option className="bg-transparent text-black" value="Enugu">
                            Enugu town ₦5000{" "}
                          </option>
                          <option className="bg-transparent text-black" value="Nsukka">
                            Nsukka ₦3000{" "}
                          </option>
                          <option className="bg-transparent text-black" value="Enugu Ezike">
                            Enugu Ezike ₦2000
                          </option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-4 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                          id="address"
                          placeholder="123 Main St"
                          value={info.address}
                          onChange={(e) => setInfo({ ...info, address: e.target.value })}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </FormSection>
                </AnimatedContainer>

                <div className="flex justify-end">
                  <Button
                    onClick={handleContinue}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#c0a146] to-[#c0a146]/90 hover:from-[#c0a146]/90 hover:to-[#c0a146] shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={!isInfoValid}
                    size="lg"
                  >
                    Continue to Payment
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="payment" className="space-y-6 mt-0">
                <AnimatedContainer animation="fadeIn">
                  <FormSection
                    title="Payment Method"
                    description="Secure payment powered by Paystack"
                    icon={ShoppingBag}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-x-2 rounded-xl border-2 border-primary/50 bg-primary/5 p-4 transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="h-6 w-10 rounded bg-gradient-to-r from-[#0052CC] to-[#00A3E0]"></div>
                          <div>
                            <p className="font-medium">Paystack</p>
                            <p className="text-sm text-muted-foreground">Pay securely with your card</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Click the pay button below to complete your payment securely. A popup will appear where you can
                        enter your card details.
                      </p>
                    </div>
                  </FormSection>
                </AnimatedContainer>

                <AnimatedContainer animation="fadeIn" delay={0.1}>
                  <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3 text-sm">
                        <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">Secure Checkout</p>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            Your payment information is processed securely by Paystack. We do not store credit card
                            details nor have access to your credit card information.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedContainer>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack} size="lg">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div className="flex gap-2">
                    {isPaystackOpen && (
                      <Button
                        variant="destructive"
                        onClick={handlePaymentClose}
                        size="lg"
                        className="hover:bg-destructive/90"
                      >
                        Cancel Payment
                      </Button>
                    )}
                    <PaystackButton
                      amount={total * 100} // amount in kobo
                      email={info.email}
                      name={`${info.firstName} ${info.lastName}`}
                      onSuccess={handlePaymentSuccess}
                      onClose={handlePaymentClose}
                      disabled={isProcessing}
                      onOpen={() => setIsPaystackOpen(true)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Order Summary */}
          <AnimatedContainer animation="slideIn" className="lg:col-span-1">
            <Card className="sticky top-6 shadow-xl border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Order Summary
                </CardTitle>
                <CardDescription>{cartItems.length} items in your cart</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {/* Cart Items */}
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-md border flex-shrink-0">
                        <Image
                          src={item.image || "/placeholder.svg?height=64&width=64"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col min-w-0">
                        <div className="flex justify-between items-start">
                          <span className="line-clamp-2 font-medium text-sm">{item.name}</span>
                          <span className="font-semibold text-sm">{formatAmount(item.price)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 hover:bg-muted"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              -
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 hover:bg-muted"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                              onClick={() => removeFromCart(item.id)}
                              aria-label="Remove"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatAmount(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery charge</span>
                    <span className="font-medium">{formatAmount(shipping)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatAmount(total)}</span>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>
      </div>
    </div>
  )
}
