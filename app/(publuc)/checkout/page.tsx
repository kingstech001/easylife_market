"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ShoppingBag, MapPin, ChevronRight, Shield, ArrowLeft, Trash2, Package, CreditCard, Minus, Plus, Lock, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { useCart } from "@/context/cart-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useFormatAmount } from "@/hooks/useFormatAmount"
import { Badge } from "@/components/ui/badge"

const CHECKOUT_STORAGE_KEY = "checkout_form_data"

export default function CheckoutPage() {
  const router = useRouter()
  const { items: cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart()
  const [activeStep, setActiveStep] = useState<"information" | "payment">("information")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [shipping, setShipping] = useState(0)
  const [isHydrated, setIsHydrated] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { formatAmount } = useFormatAmount()

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

  // Load saved checkout data on mount
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
          }
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

  // Restore checkout state after login redirect
  useEffect(() => {
    if (!isHydrated) return

    try {
      const savedRedirectData = localStorage.getItem('checkout_redirect_data')
      if (savedRedirectData) {
        const data = JSON.parse(savedRedirectData)
        
        // Check if data is recent (within last 30 minutes)
        const age = Date.now() - data.timestamp
        if (age < 30 * 60 * 1000) {
          setInfo(data.info || info)
          setShipping(data.shipping || 0)
          setActiveStep(data.activeStep || 'information')
          
          toast.success('Welcome back! Your checkout is ready.')
          
          // Clean up
          localStorage.removeItem('checkout_redirect_data')
        }
      }
    } catch (error) {
      console.error('Failed to restore checkout data:', error)
    }
  }, [isHydrated])

  // Auto-save checkout data
  useEffect(() => {
    if (!isHydrated) return

    const saveToStorage = () => {
      try {
        const dataToSave = { info, activeStep, shipping }
        localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(dataToSave))
      } catch (error) {
        console.error("Failed to save checkout data to localStorage:", error)
      }
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(saveToStorage, 500)

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") saveToStorage()
    }
    const handleBeforeUnload = () => {
      saveToStorage()
    }
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [info, activeStep, shipping, isHydrated])

  const isInfoValid =
    info.firstName.trim() &&
    info.lastName.trim() &&
    info.email.trim() &&
    info.address.trim() &&
    info.state.trim() &&
    info.area.trim()

  const subtotal = getTotalPrice()
  const total = subtotal + shipping

  // ✅ Initialize payment with authentication check
  const handlePayNow = async () => {
    setIsInitializing(true)
    try {
      // ✅ STEP 1: Check authentication using your /api/me endpoint
      const userResponse = await fetch('/api/me', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      // Parse response
      const userData = await userResponse.json()
      
      // Check if user is authenticated
      // Your API returns { user: null } when not authenticated
      if (!userResponse.ok || !userData.user) {
        console.error('Authentication check failed:', userResponse.status, userData)
        
        // Save current checkout state before redirecting
        try {
          localStorage.setItem('checkout_redirect_data', JSON.stringify({
            info,
            shipping,
            activeStep,
            timestamp: Date.now()
          }))
        } catch (e) {
          console.error('Failed to save checkout state:', e)
        }
        
        toast.error('Please log in to complete your purchase')
        
        // Redirect to login (adjust this path to match your login route)
        router.push('/auth/login?redirect=/checkout')
        setIsInitializing(false)
        return
      }
      
      // Extract user ID - your API returns user._id
      const userId = userData.user._id || userData.user.id
      
      if (!userId) {
        console.error('User ID not found in response:', userData)
        toast.error('User ID not found. Please log in again.')
        router.push('/auth/login?redirect=/checkout')
        setIsInitializing(false)
        return
      }

      console.log('✅ User authenticated:', userId)
      console.log('User data:', userData.user)

      // Group items by store
      const groupedByStore: Record<string, typeof cartItems> = {}
      cartItems.forEach((item) => {
        if (!groupedByStore[item.storeId]) groupedByStore[item.storeId] = []
        groupedByStore[item.storeId].push(item)
      })

      // Prepare orders with ONLY productId and quantity
      // Server will fetch prices and validate
      const orders = Object.entries(groupedByStore).map(([storeId, storeItems]) => ({
        storeId,
        items: storeItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }))

      console.log('📦 Prepared orders:', orders)

      // Initialize payment
      const initResponse = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          email: info.email,
          amount: total, // For display/validation only - server recalculates
          type: "checkout",
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
          deliveryFee: shipping,
          paymentMethod: "card",
          userId, // ✅ CRITICAL: Include userId for webhook
        }),
      })

      const initData = await initResponse.json()

      if (!initResponse.ok) {
        throw new Error(initData.error || "Failed to initialize payment")
      }

      console.log('✅ Payment initialized:', initData.reference)

      // Store reference for verification after payment
      sessionStorage.setItem("pending_payment_reference", initData.reference)

      // Clear checkout form data since we're proceeding
      localStorage.removeItem('checkout_redirect_data')

      // Redirect to Paystack
      window.location.href = initData.authorization_url
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize payment"
      console.error('❌ Payment initialization error:', errorMessage)
      toast.error(errorMessage)
      setIsInitializing(false)
    }
  }

  // Check for payment callback on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const reference = urlParams.get("reference")
    const trxref = urlParams.get("trxref")
    
    const paymentReference = reference || trxref

    if (paymentReference) {
      // Payment callback detected
      handlePaymentCallback(paymentReference)
    }
  }, [])

  const handlePaymentCallback = async (reference: string) => {
    setIsProcessing(true)
    try {
      // SECURE: Only send reference - server has everything else
      const verifyResponse = await fetch("/api/payment/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          reference, // ✅ Only reference - no orderData!
        }),
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to verify payment")
      }

      const verifyData = await verifyResponse.json()

      // ✅ Clear cart immediately after successful payment verification
      console.log('✅ Payment verified successfully, clearing cart...')
      clearCart()
      
      // Clear saved checkout data
      localStorage.removeItem(CHECKOUT_STORAGE_KEY)
      localStorage.removeItem('checkout_redirect_data')
      sessionStorage.removeItem("pending_payment_reference")

      toast.success("Payment successful! Your order has been placed.")

      // Redirect to confirmation
      router.push(`/checkout/payment-success?reference=${reference}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to verify payment"
      console.error('❌ Payment verification error:', errorMessage)
      toast.error(errorMessage)
      // Clean up URL
      router.replace("/checkout")
      setIsProcessing(false)
    }
  }

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

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedArea = e.target.value
    setInfo({ ...info, area: selectedArea })

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

  if (cartItems.length === 0 && !isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="container px-4 py-20 max-w-[1280px] mx-auto text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">Add some items to your cart before checking out.</p>
            <Button onClick={() => router.push("/stores")} size="lg" className="rounded-xl">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Start Shopping
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container px-4 py-10 max-w-[1400px] mx-auto">
        <AnimatedContainer animation="fadeIn" className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/stores")}
            className="mb-4 hover:bg-primary/10 rounded-xl"
            disabled={isProcessing || isInitializing}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue shopping
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Secure Checkout</h1>
              <p className="text-muted-foreground">Complete your order safely and securely</p>
            </div>
          </div>
        </AnimatedContainer>

        {isProcessing && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="p-8 max-w-md mx-4">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <h3 className="text-xl font-bold">Verifying Payment</h3>
                <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Tabs value={activeStep} className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-8 bg-muted/50 p-1.5 rounded-2xl h-auto">
                <TabsTrigger
                  value="information"
                  className={cn(
                    "flex items-center gap-2 rounded-xl transition-all duration-200 h-12",
                    "data-[state=active]:bg-background data-[state=active]:shadow-md"
                  )}
                  onClick={() => setActiveStep("information")}
                  disabled={isProcessing || isInitializing}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        activeStep === "information"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {isInfoValid ? <CheckCircle className="h-4 w-4" /> : "1"}
                    </div>
                    <span className="hidden sm:inline font-semibold">Information</span>
                    <span className="sm:hidden font-semibold">Info</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className={cn(
                    "flex items-center gap-2 rounded-xl transition-all duration-200 h-12",
                    "data-[state=active]:bg-background data-[state=active]:shadow-md"
                  )}
                  onClick={() => setActiveStep("payment")}
                  disabled={!isInfoValid || isProcessing || isInitializing}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        activeStep === "payment"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      2
                    </div>
                    <span className="hidden sm:inline font-semibold">Payment</span>
                    <span className="sm:hidden font-semibold">Pay</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="information" className="space-y-6 mt-0">
                <AnimatedContainer animation="fadeIn">
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <CardTitle>Contact Information</CardTitle>
                          <CardDescription>We'll use this to send your order confirmation</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                              id="firstName"
                              placeholder="Kingsley"
                              value={info.firstName}
                              onChange={(e) => setInfo({ ...info, firstName: e.target.value })}
                              className="h-11 rounded-xl border-2"
                              disabled={isProcessing || isInitializing}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input
                              id="lastName"
                              placeholder="Mamah"
                              value={info.lastName}
                              onChange={(e) => setInfo({ ...info, lastName: e.target.value })}
                              className="h-11 rounded-xl border-2"
                              disabled={isProcessing || isInitializing}
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
                            className="h-11 rounded-xl border-2"
                            disabled={isProcessing || isInitializing}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (optional)</Label>
                          <Input
                            id="phone"
                            placeholder="08012345678"
                            value={info.phone}
                            onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                            className="h-11 rounded-xl border-2"
                            disabled={isProcessing || isInitializing}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedContainer>

                <AnimatedContainer animation="fadeIn" delay={0.1}>
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <CardTitle>Delivery Address</CardTitle>
                          <CardDescription>Where should we send your order?</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <select
                            id="state"
                            value={info.state}
                            onChange={(e) => setInfo({ ...info, state: e.target.value })}
                            className="w-full h-11 rounded-xl border-2 px-3 py-2 text-sm bg-transparent"
                            disabled={isProcessing || isInitializing}
                          >
                            <option className="bg-background text-foreground" value="">
                              Select a state
                            </option>
                            <option className="bg-background text-foreground" value="Enugu">
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
                            className="w-full h-11 rounded-xl border-2 px-3 py-2 text-sm bg-transparent"
                            disabled={isProcessing || isInitializing}
                          >
                            <option className="bg-background text-foreground" value="">
                              Select delivery area
                            </option>
                            <option className="bg-background text-foreground" value="Enugu">
                              Enugu town - ₦5,000
                            </option>
                            <option className="bg-background text-foreground" value="Nsukka">
                              Nsukka - ₦3,000
                            </option>
                            <option className="bg-background text-foreground" value="Enugu Ezike">
                              Enugu Ezike - ₦2,000
                            </option>
                          </select>
                        </div>
                      </div>
                      <div className="grid gap-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">Street Address *</Label>
                          <Input
                            id="address"
                            placeholder="123 Main Street, Apartment 4B"
                            value={info.address}
                            onChange={(e) => setInfo({ ...info, address: e.target.value })}
                            className="h-11 rounded-xl border-2"
                            disabled={isProcessing || isInitializing}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedContainer>

                <div className="flex justify-end">
                  <Button
                    onClick={handleContinue}
                    className="w-full sm:w-auto h-12 rounded-xl shadow-lg text-base font-semibold"
                    disabled={!isInfoValid || isProcessing || isInitializing}
                    size="lg"
                  >
                    Continue to Payment
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="payment" className="space-y-6 mt-0">
                <AnimatedContainer animation="fadeIn">
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="bg-gradient-to-br from-primary/5 to-primary/10 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <CardTitle>Payment Method</CardTitle>
                          <CardDescription>Secure payment powered by Paystack</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between space-x-2 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4 transition-all duration-200">
                          <div className="flex items-center space-x-4">
                            <Image src={"/paystack.jpeg"} alt="paystack-logo" width={50} height={50}></Image>
                            <div>
                              <p className="text-[12px] font-semibold md:text-base">Paystack Payment</p>
                              <p className="text-[10px] md:text-sm text-muted-foreground">
                                Pay securely with card, bank transfer, or USSD
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="gap-1 ml-0">
                            <Shield className="h-3 w-3" />
                            Secure
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedContainer>

                <AnimatedContainer animation="fadeIn" delay={0.1}>
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 dark:border-green-800 dark:from-green-950/20 dark:to-green-900/10">
                    <CardContent className="pt-6 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold md:text-base text-green-900 dark:text-green-100 mb-1">
                            100% Secure Checkout
                          </p>
                          <p className="text-[10px] md:text-sm text-green-700 dark:text-green-300">
                            Your payment information is processed securely by Paystack. We do not store credit card
                            details nor have access to your credit card information. All prices are validated
                            server-side for your protection.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedContainer>

                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    size="lg"
                    className="h-12 rounded-xl border-2"
                    disabled={isProcessing || isInitializing}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Information
                  </Button>
                  <Button
                    onClick={handlePayNow}
                    size="lg"
                    className="h-12 rounded-xl shadow-lg text-base font-semibold"
                    disabled={isProcessing || isInitializing}
                  >
                    {isInitializing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Pay {formatAmount(total)}
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Order Summary */}
          <AnimatedContainer animation="slideIn" className="lg:col-span-1">
            <Card className="sticky top-6 shadow-2xl border-2 overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 border-b-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Order Summary</CardTitle>
                      <CardDescription>{cartItems.length} items</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {/* Cart Items */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <Card key={item.id} className="border-2 hover:border-primary/50 transition-all overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <div className="relative h-20 w-20 overflow-hidden rounded-xl border-2 flex-shrink-0 bg-muted">
                            <Image
                              src={item.image || "/placeholder.svg?height=80&width=80"}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex flex-1 flex-col min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <span className="line-clamp-2 font-semibold text-sm leading-tight">{item.name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0"
                                onClick={() => removeFromCart(item.id)}
                                disabled={isProcessing || isInitializing}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center border-2 rounded-lg overflow-hidden">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-none hover:bg-primary/10"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || isProcessing || isInitializing}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="px-3 text-xs font-bold min-w-[2rem] text-center">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-none hover:bg-primary/10"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  disabled={isProcessing || isInitializing}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="font-bold text-sm text-primary">
                                {formatAmount(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Totals */}
                <Card className="border-0 bg-muted/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">{formatAmount(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery charge</span>
                      <span className="font-semibold">{formatAmount(shipping)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold text-primary">{formatAmount(total)}</span>
                    </div>
                  </CardContent>
                </Card>

                {activeStep === "payment" && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-3">
                    <p className="text-xs text-amber-900 dark:text-amber-100">
                      💡 <strong>Note:</strong> Final amount will be validated against current product prices when you
                      click Pay.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>
      </div>
    </div>
  )
}