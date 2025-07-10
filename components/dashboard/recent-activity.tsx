"use client"

import { Store, ShoppingCart, Users, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function RecentActivity() {
  // In a real app, we would fetch this data from the API
  const activities = [
    {
      id: 1,
      type: "store_created",
      title: "Store Created",
      description: "You created a new store: Fashion Boutique",
      icon: Store,
      timestamp: "2 hours ago",
    },
    {
      id: 2,
      type: "product_added",
      title: "Product Added",
      description: "You added a new product: Men's Casual T-Shirt",
      icon: ShoppingCart,
      timestamp: "3 hours ago",
    },
    {
      id: 3,
      type: "sale_completed",
      title: "Sale Completed",
      description: "New order #1234 for $49.99",
      icon: DollarSign,
      timestamp: "5 hours ago",
    },
    {
      id: 4,
      type: "customer_registered",
      title: "New Customer",
      description: "John Doe registered as a customer",
      icon: Users,
      timestamp: "1 day ago",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest store activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <activity.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
