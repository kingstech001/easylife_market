"use client"

import { Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function BillingPlans() {
  const plans = [
    {
      id: "free",
      name: "Free",
      description: "For individuals just getting started",
      price: 0,
      features: ["1 store", "10 products", "Basic analytics", "Community support"],
      limitations: ["ShopBuilder branding", "Limited customization"],
      cta: "Current Plan",
      disabled: true,
    },
    {
      id: "starter",
      name: "Starter",
      description: "For small businesses ready to grow",
      price: 9.99,
      features: [
        "3 stores",
        "100 products",
        "Advanced analytics",
        "Email support",
        "Custom domain",
        "No ShopBuilder branding",
      ],
      limitations: [],
      cta: "Upgrade to Starter",
      popular: true,
    },
    {
      id: "professional",
      name: "Professional",
      description: "For established businesses",
      price: 29.99,
      features: [
        "10 stores",
        "Unlimited products",
        "Advanced analytics",
        "Priority support",
        "Custom domain",
        "No ShopBuilder branding",
        "API access",
        "Abandoned cart recovery",
      ],
      limitations: [],
      cta: "Upgrade to Professional",
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {plans.map((plan) => (
        <Card key={plan.id} className={plan.popular ? "border-primary" : ""}>
          {plan.popular && (
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
              <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                Popular
              </span>
            </div>
          )}
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

              {plan.limitations.map((limitation) => (
                <div key={limitation} className="flex items-center text-muted-foreground">
                  <span className="h-4 w-4 mr-2">-</span>
                  <span className="text-sm">{limitation}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled={plan.disabled}>
              {plan.cta}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
