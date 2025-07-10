"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { CreditCard, ShoppingBag, MapPin, Truck, ChevronRight, Shield, ArrowLeft, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { FormSection } from "@/components/ui/form-section"
import { mockProducts } from "@/lib/mock-data"
import { formatPrice } from "@/lib/utils"

// Mock cart items
const initialCartItems = [
  { id: 1, productId: mockProducts[0].id, quantity: 1 },
  { id: 2, productId: mockProducts[1].id, quantity: 2 },
]

export default function CheckoutPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState<"information" | "shipping" | "payment">("information")
  const [isProcessing, setIsProcessing] = useState(false)
  const [cartItems, setCartItems] = useState(initialCartItems)

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

  // Get product details from mock data
  const items = cartItems.map((item) => {
    const product = mockProducts.find((p) => p.id === item.productId)
    return {
      ...item,
      product,
    }
  })

  // Calculate totals
  const subtotal = items.reduce((total, item) => {
    return total + (item.product?.price || 0) * item.quantity
  }, 0)

  const shipping = shippingMethod === "express" ? 12.99 : 5.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  // Remove item from cart
  const handleRemoveItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Update quantity
  const handleUpdateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) return
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  // Step navigation
  const handleContinue = () => {
    if (activeStep === "information") {
      if (isInfoValid) setActiveStep("shipping")
    } else if (activeStep === "shipping") {
      if (isShippingValid) setActiveStep("payment")
    } else if (activeStep === "payment") {
      if (isPaymentValid) {
        setIsProcessing(true)
        setTimeout(() => {
          setIsProcessing(false)
          router.push("/checkout/confirmation")
        }, 2000)
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

  // If cart is empty, redirect to cart page
  if (cartItems.length === 0) {
    if (typeof window !== "undefined") {
      router.push("/cart")
    }
    return null
  }

  return (
    <div className="container px-4 py-10 max-w-[1280px] mx-auto">
      <AnimatedContainer animation="fadeIn" className="mb-8">
        <Button variant="ghost" onClick={() => router.push("/cart")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </AnimatedContainer>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <Tabs value={activeStep} className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-8">
              <TabsTrigger
                value="information"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                onClick={() => setActiveStep("information")}
              >
                <span className="hidden sm:inline">Information</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                onClick={() => setActiveStep("shipping")}
                disabled={activeStep === "information"}
              >
                <span className="hidden sm:inline">Shipping</span>
                <span className="sm:hidden">Ship</span>
              </TabsTrigger>
              <TabsTrigger
                value="payment"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                onClick={() => setActiveStep("payment")}
                disabled={activeStep === "information" || activeStep === "shipping"}
              >
                <span className="hidden sm:inline">Payment</span>
                <span className="sm:hidden">Pay</span>
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
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={info.firstName}
                          onChange={e => setInfo({ ...info, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={info.lastName}
                          onChange={e => setInfo({ ...info, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={info.email}
                        onChange={e => setInfo({ ...info, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input
                        id="phone"
                        placeholder="(123) 456-7890"
                        value={info.phone}
                        onChange={e => setInfo({ ...info, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </FormSection>
              </AnimatedContainer>

              <AnimatedContainer animation="fadeIn" delay={0.1}>
                <FormSection title="Shipping Address" description="Where should we send your order?" icon={MapPin}>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        placeholder="123 Main St"
                        value={info.address}
                        onChange={e => setInfo({ ...info, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apartment">Apartment, suite, etc. (optional)</Label>
                      <Input id="apartment" placeholder="Apt 4B" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          placeholder="New York"
                          value={info.city}
                          onChange={e => setInfo({ ...info, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          placeholder="NY"
                          value={info.state}
                          onChange={e => setInfo({ ...info, state: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                          id="zip"
                          placeholder="10001"
                          value={info.zip}
                          onChange={e => setInfo({ ...info, zip: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </FormSection>
              </AnimatedContainer>

              <div className="flex justify-end">
                <Button
                  onClick={handleContinue}
                  className="w-full sm:w-auto"
                  disabled={!isInfoValid}
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
                    onValueChange={val => setShippingMethod(val as "standard" | "express")}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="standard" id="standard" />
                        <Label htmlFor="standard" className="font-normal">
                          Standard Shipping (3-5 business days)
                        </Label>
                      </div>
                      <div className="text-sm font-medium">$5.99</div>
                    </div>
                    <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="express" id="express" />
                        <Label htmlFor="express" className="font-normal">
                          Express Shipping (1-2 business days)
                        </Label>
                      </div>
                      <div className="text-sm font-medium">$12.99</div>
                    </div>
                  </RadioGroup>
                </FormSection>
              </AnimatedContainer>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleContinue} disabled={!isShippingValid}>
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
                    onValueChange={val => setPayment({ ...payment, method: val })}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="font-normal">
                          Credit / Debit Card
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 w-10 rounded bg-blue-600"></div>
                        <div className="h-6 w-10 rounded bg-red-500"></div>
                        <div className="h-6 w-10 rounded bg-yellow-400"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between space-x-2 rounded-md border p-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="font-normal">
                          PayPal
                        </Label>
                      </div>
                      <div className="h-6 w-10 rounded bg-blue-700"></div>
                    </div>
                  </RadioGroup>

                  {payment.method === "card" && (
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={payment.cardNumber}
                          onChange={e => setPayment({ ...payment, cardNumber: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input
                            id="expiry"
                            placeholder="MM/YY"
                            value={payment.expiry}
                            onChange={e => setPayment({ ...payment, expiry: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input
                            id="cvc"
                            placeholder="123"
                            value={payment.cvc}
                            onChange={e => setPayment({ ...payment, cvc: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nameOnCard">Name on Card</Label>
                        <Input
                          id="nameOnCard"
                          placeholder="John Doe"
                          value={payment.nameOnCard}
                          onChange={e => setPayment({ ...payment, nameOnCard: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </FormSection>
              </AnimatedContainer>

              <AnimatedContainer animation="fadeIn" delay={0.1}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-2 text-sm">
                      <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Secure Checkout</p>
                        <p className="text-muted-foreground">
                          Your payment information is processed securely. We do not store credit card details nor have
                          access to your credit card information.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedContainer>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleContinue} disabled={!isPaymentValid || isProcessing}>
                  {isProcessing ? (
                    "Processing..."
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
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>{items.length} items in your cart</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-md border">
                      <Image
                        src={item.product?.images[0]?.url || "/placeholder.svg?height=64&width=64"}
                        alt={item.product?.name || "Product"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between">
                        <span className="line-clamp-1 font-medium">{item.product?.name}</span>
                        <span className="font-medium">{formatPrice(item.product?.price || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            -
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0"
                            onClick={() => handleRemoveItem(item.id)}
                            aria-label="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </div>
    </div>
  )
}