"use client"

import { Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function BillingPlans() {
  const plans = [
    {
      id: "free",
      name: "Free",
      description: "Start selling with zero cost",
      price: 0,
      features: ["1 store", "20 products", "Basic analytics", "Community support"],
      cta: "Current Plan",
      disabled: true,
      comingSoon: false,
    },
    {
      id: "starter",
      name: "Starter",
      description: "For small businesses ready to grow",
      price: 9.99,
      features: [
        "1 store",
        "100 products",
        "Advanced analytics",
        "Email support",
        "Custom domain",
        "No ShopBuilder branding",
      ],
      cta: "Coming Soon",
      disabled: true,
      comingSoon: true,
    },
    {
      id: "professional",
      name: "Professional",
      description: "For established businesses",
      price: 29.99,
      features: [
        "1 store",
        "Unlimited products",
        "Advanced analytics",
        "Priority support",
        "Custom domain",
        "No ShopBuilder branding",
        "API access",
        "Abandoned cart recovery",
      ],
      cta: "Coming Soon",
      disabled: true,
      comingSoon: true,
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative overflow-hidden ${
            plan.comingSoon ? "opacity-60 blur-[1px]" : ""
          }`}
        >
          {/* If it's a coming soon plan, overlay the badge in the center */}
          {plan.comingSoon && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className="bg-yellow-500 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
                Coming Soon
              </span>
            </div>
          )}

          {/* Only render the plan details if it's NOT coming soon */}
          {!plan.comingSoon && (
            <>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center">
                      <Check className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button className="w-full" disabled={plan.disabled}>
                  {plan.cta}
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      ))}
    </div>
  )
}
