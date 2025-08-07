"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CreditCard, ShoppingBag, MapPin, Truck, ChevronRight, Shield, ArrowLeft, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { FormSection } from "@/components/ui/form-section"
import { useCart } from "@/context/cart-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function CheckoutPage() {
  const router = useRouter()
  const { items: cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart()
  const [activeStep, setActiveStep] = useState<"information" | "shipping" | "payment">("information")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  // Form state for information step
  const [info, setInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    apartment: "",
  })

  // Form state for shipping step
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard")

  // Form state for payment step
  const [payment, setPayment] = useState({
    method: "card",
    cardNumber: "",
    expiry: "",
    cvc: "",
    nameOnCard: "",
  })

  // Load user info on mount
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        console.log("Checkout: Verifying user authentication...")
        const response = await fetch("/api/auth/verify", {
          credentials: "include",
        })

        console.log("Checkout: Auth verification response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("Checkout: User verified:", { role: data.user?.role, email: data.user?.email })

          if (data.user?.role !== "buyer") {
            setAuthError("Only buyers can access checkout")
            return
          }

          setInfo((prev) => ({
            ...prev,
            email: data.user.email || "",
          }))
        } else {
          console.log("Checkout: Auth verification failed")
          setAuthError("Please log in to continue")
        }
      } catch (error) {
        console.error("Checkout: Failed to load user info:", error)
        setAuthError("Authentication error")
      } finally {
        setIsLoading(false)
      }
    }

    loadUserInfo()
  }, [])

  // Validation for required fields
  const isInfoValid =
    info.firstName.trim() &&
    info.lastName.trim() &&
    info.email.trim() &&
    info.address.trim() &&
    info.city.trim() &&
    info.state.trim() &&
    info.zip.trim()

  const isShippingValid = !!shippingMethod

  const isPaymentValid =
    payment.method === "paypal" ||
    (payment.method === "card" &&
      payment.cardNumber.trim() &&
      payment.expiry.trim() &&
      payment.cvc.trim() &&
      payment.nameOnCard.trim())

  // Calculate totals
  const subtotal = getTotalPrice()
  const shipping = shippingMethod === "express" ? 12.99 : 5.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  // Handle order submission
  const handleCompleteOrder = async () => {
    setIsProcessing(true)

    try {
      console.log("Checkout: Starting order submission...")

      const orderData = {
        items: cartItems,
        shippingInfo: info,
        shippingMethod,
        paymentMethod: payment.method,
        totals: {
          subtotal,
          shipping,
          tax,
          total,
        },
      }

      console.log("Checkout: Order data prepared:", {
        itemCount: orderData.items.length,
        total: orderData.totals.total,
        shippingMethod: orderData.shippingMethod,
        paymentMethod: orderData.paymentMethod,
      })

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderData),
      })

      console.log("Checkout: Order API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Checkout: Order submission failed:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create order`)
      }

      const result = await response.json()
      console.log("Checkout: Order created successfully:", result)

      // Clear cart and redirect to confirmation
      clearCart()
      toast.success("Order placed successfully!")
      router.push(`/checkout/confirmation?orderId=${result.orderId}`)
    } catch (error) {
      console.error("Checkout: Order submission error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to place order"
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  // Step navigation
  const handleContinue = () => {
    if (activeStep === "information") {
      if (isInfoValid) setActiveStep("shipping")
    } else if (activeStep === "shipping") {
      if (isShippingValid) setActiveStep("payment")
    } else if (activeStep === "payment") {
      if (isPaymentValid) {
        handleCompleteOrder()
      }
    }
  }

  const handleBack = () => {
    if (activeStep === "shipping") {
      setActiveStep("information")
    } else if (activeStep === "payment") {
      setActiveStep("shipping")
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container px-4 py-20 max-w-[1280px] mx-auto">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading checkout...</span>
        </div>
      </div>
    )
  }

  // Auth error state
  if (authError) {
    return (
      <div className="container px-4 py-20 max-w-[1280px] mx-auto text-center">
        <div className="max-w-md mx-auto">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
          <p className="text-muted-foreground mb-6">{authError}</p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => router.push("/auth/login")} className="w-full">
              Login as Buyer
            </Button>
            <Button variant="outline" onClick={() => router.push("/")} className="w-full">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If cart is empty, redirect to cart page
  if (cartItems.length === 0) {
    return (
      <div className="container px-4 py-20 max-w-[1280px] mx-auto text-center">
        <div className="max-w-md mx-auto">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some items to your cart before checking out.</p>
          <Button onClick={() => router.push("/")} className="w-full">
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
          <Button variant="ghost" onClick={() => router.push("/cart")} className="mb-4 hover:bg-muted/50">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
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
              <TabsList className="w-full grid grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl">
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
                  value="shipping"
                  className={cn(
                    "flex items-center gap-2 rounded-lg transition-all duration-200",
                    "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                  )}
                  onClick={() => setActiveStep("shipping")}
                  disabled={!isInfoValid}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                        activeStep === "shipping"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      2
                    </div>
                    <span className="hidden sm:inline">Shipping</span>
                    <span className="sm:hidden">Ship</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className={cn(
                    "flex items-center gap-2 rounded-lg transition-all duration-200",
                    "data-[state=active]:bg-background data-[state=active]:shadow-sm",
                  )}
                  onClick={() => setActiveStep("payment")}
                  disabled={!isInfoValid || !isShippingValid}
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
                      3
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
                            placeholder="John"
                            value={info.firstName}
                            onChange={(e) => setInfo({ ...info, firstName: e.target.value })}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            placeholder="Doe"
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
                          placeholder="(123) 456-7890"
                          value={info.phone}
                          onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </FormSection>
                </AnimatedContainer>

                <AnimatedContainer animation="fadeIn" delay={0.1}>
                  <FormSection title="Shipping Address" description="Where should we send your order?" icon={MapPin}>
                    <div className="grid gap-4">
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
                      <div className="space-y-2">
                        <Label htmlFor="apartment">Apartment, suite, etc. (optional)</Label>
                        <Input
                          id="apartment"
                          placeholder="Apt 4B"
                          value={info.apartment}
                          onChange={(e) => setInfo({ ...info, apartment: e.target.value })}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            placeholder="New York"
                            value={info.city}
                            onChange={(e) => setInfo({ ...info, city: e.target.value })}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            placeholder="NY"
                            value={info.state}
                            onChange={(e) => setInfo({ ...info, state: e.target.value })}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zip">ZIP Code *</Label>
                          <Input
                            id="zip"
                            placeholder="10001"
                            value={info.zip}
                            onChange={(e) => setInfo({ ...info, zip: e.target.value })}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>
                  </FormSection>
                </AnimatedContainer>

                <div className="flex justify-end">
                  <Button
                    onClick={handleContinue}
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={!isInfoValid}
                    size="lg"
                  >
                    Continue to Shipping
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="shipping" className="space-y-6 mt-0">
                <AnimatedContainer animation="fadeIn">
                  <FormSection
                    title="Shipping Method"
                    description="Choose how you want your order delivered"
                    icon={Truck}
                  >
                    <RadioGroup
                      value={shippingMethod}
                      onValueChange={(val) => setShippingMethod(val as "standard" | "express")}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between space-x-2 rounded-xl border-2 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="standard" id="standard" />
                          <div>
                            <Label htmlFor="standard" className="font-medium cursor-pointer">
                              Standard Shipping
                            </Label>
                            <p className="text-sm text-muted-foreground">3-5 business days</p>
                          </div>
                        </div>
                        <div className="text-lg font-semibold">₦5.99</div>
                      </div>
                      <div className="flex items-center justify-between space-x-2 rounded-xl border-2 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="express" id="express" />
                          <div>
                            <Label htmlFor="express" className="font-medium cursor-pointer">
                              Express Shipping
                            </Label>
                            <p className="text-sm text-muted-foreground">1-2 business days</p>
                          </div>
                        </div>
                        <div className="text-lg font-semibold">₦12.99</div>
                      </div>
                    </RadioGroup>
                  </FormSection>
                </AnimatedContainer>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack} size="lg">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={!isShippingValid}
                    className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200"
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
                    description="All transactions are secure and encrypted"
                    icon={CreditCard}
                  >
                    <RadioGroup
                      value={payment.method}
                      onValueChange={(val) => setPayment({ ...payment, method: val })}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between space-x-2 rounded-xl border-2 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="font-medium cursor-pointer">
                            Credit / Debit Card
                          </Label>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-6 w-10 rounded bg-blue-600"></div>
                          <div className="h-6 w-10 rounded bg-red-500"></div>
                          <div className="h-6 w-10 rounded bg-yellow-400"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between space-x-2 rounded-xl border-2 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-muted/30">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="paypal" id="paypal" />
                          <Label htmlFor="paypal" className="font-medium cursor-pointer">
                            PayPal
                          </Label>
                        </div>
                        <div className="h-6 w-16 rounded bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
                          PayPal
                        </div>
                      </div>
                    </RadioGroup>

                    {payment.method === "card" && (
                      <div className="mt-6 space-y-4 p-4 bg-muted/30 rounded-xl">
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Card Number *</Label>
                          <Input
                            id="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={payment.cardNumber}
                            onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiry">Expiry Date *</Label>
                            <Input
                              id="expiry"
                              placeholder="MM/YY"
                              value={payment.expiry}
                              onChange={(e) => setPayment({ ...payment, expiry: e.target.value })}
                              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cvc">CVC *</Label>
                            <Input
                              id="cvc"
                              placeholder="123"
                              value={payment.cvc}
                              onChange={(e) => setPayment({ ...payment, cvc: e.target.value })}
                              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nameOnCard">Name on Card *</Label>
                          <Input
                            id="nameOnCard"
                            placeholder="John Doe"
                            value={payment.nameOnCard}
                            onChange={(e) => setPayment({ ...payment, nameOnCard: e.target.value })}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    )}
                  </FormSection>
                </AnimatedContainer>

                <AnimatedContainer animation="fadeIn" delay={0.1}>
                  <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3 text-sm">
                        <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">Secure Checkout</p>
                          <p className="text-green-700 dark:text-green-300 mt-1">
                            Your payment information is processed securely. We do not store credit card details nor have
                            access to your credit card information.
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
                  <Button
                    onClick={handleContinue}
                    disabled={!isPaymentValid || isProcessing}
                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Complete Order
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
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
                          <span className="font-semibold text-sm">₦{item.price.toFixed(2)}</span>
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
                    <span className="font-medium">₦{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">₦{shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">₦{tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₦{total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>
      </div>
    </div>
  )
}
