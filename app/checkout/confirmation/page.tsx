"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, Package, Truck, Home, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatedContainer } from "@/components/ui/animated-container"

export default function ConfirmationPage() {
  const router = useRouter()
  const orderNumber = "ORD-" + Math.floor(100000 + Math.random() * 900000)

  return (
    <div className="container max-w-3xl py-16 mx-auto px-4">
      <AnimatedContainer animation="scale" className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center rounded-full bg-green-100 p-6 mb-4"
        >
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-4">Thank you for your purchase. Your order has been confirmed.</p>
        <p className="font-medium">
          Order Number: <span className="text-primary">{orderNumber}</span>
        </p>
      </AnimatedContainer>

      <AnimatedContainer animation="fadeIn" delay={0.2} className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Order Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    We're preparing your order for shipment. You'll receive an email when your order ships.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Shipping</h3>
                  <p className="text-sm text-muted-foreground">
                    Your order will be delivered in 3-5 business days. You'll receive tracking information via email.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Delivery</h3>
                  <p className="text-sm text-muted-foreground">
                    Your items will be delivered to the address you provided during checkout.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            View Order in Dashboard
          </Button>
          <Button onClick={() => router.push("/")}>
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </AnimatedContainer>
    </div>
  )
}
