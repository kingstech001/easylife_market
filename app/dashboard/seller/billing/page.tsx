"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { CreditCard, Package, Loader2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BillingPlans } from "@/components/dashboard/billing-plans"
import { BillingHistory } from "@/components/dashboard/billing-history"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton" // Import Skeleton for loading states

type CurrentPlan = {
  name: string
  features: string
  price: number
  interval: string
}

type PaymentMethod = {
  exists: boolean
  brand: string | null
  last4: string | null
}

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [isLoadingBillingInfo, setIsLoadingBillingInfo] = useState(true)
  const [billingInfoError, setBillingInfoError] = useState<string | null>(null)

  const fetchBillingInfo = useCallback(async () => {
    setIsLoadingBillingInfo(true)
    setBillingInfoError(null)
    try {
      const response = await fetch("/api/seller/billing/info")
      if (!response.ok) {
        let errorMessage = "Failed to fetch billing information."
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (jsonError) {
          console.warn("Could not parse billing error response as JSON, trying text:", jsonError)
          try {
            const errorText = await response.text()
            if (errorText) {
              errorMessage = `Server error: ${errorText.substring(0, Math.min(errorText.length, 100))}...`
            }
          } catch (textError) {
            console.warn("Could not get billing error response as text:", textError)
          }
        }
        throw new Error(errorMessage)
      }
      const data = await response.json()
      setCurrentPlan(data.data.currentPlan)
      setPaymentMethod(data.data.paymentMethod)
    } catch (err: any) {
      console.error("Error fetching billing info:", err)
      setBillingInfoError(err.message || "An unexpected error occurred.")
      toast.error("Failed to load billing information", {
        description: err.message || "Please try again later.",
      })
    } finally {
      setIsLoadingBillingInfo(false)
    }
  }, [])

  useEffect(() => {
    fetchBillingInfo()
  }, [fetchBillingInfo])

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
      </motion.div>

      {/* Current Plan & Payment Method Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-2"
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingBillingInfo ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : billingInfoError ? (
              <p className="text-destructive text-sm">Error: {billingInfoError}</p>
            ) : (
              <>
                <div className="text-2xl font-bold">{currentPlan?.name || "N/A"}</div>
                <p className="text-xs text-muted-foreground">{currentPlan?.features || "1 store · 20 products"}</p>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-transparent" variant="outline" disabled={isLoadingBillingInfo}>
              {isLoadingBillingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade Plan"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingBillingInfo ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : billingInfoError ? (
              <p className="text-destructive text-sm">Error: {billingInfoError}</p>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {paymentMethod?.exists ? `${paymentMethod.brand} **** ${paymentMethod.last4}` : "No Payment Method"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {paymentMethod?.exists ? "Your primary payment method" : "Add a payment method to upgrade your plan"}
                </p>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled={isLoadingBillingInfo}>
              {isLoadingBillingInfo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Payment Method"}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Tabs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-10 sm:h-12 bg-muted/50 dark:bg-muted/20 p-1">
            <TabsTrigger value="plans" className="text-xs sm:text-sm px-2 sm:px-3">
              Available Plans
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm px-2 sm:px-3">
              Billing History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="plans">
            <BillingPlans />
          </TabsContent>
          <TabsContent value="history">
            <BillingHistory />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
