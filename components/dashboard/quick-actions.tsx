"use client"

import Link from "next/link"
import { Plus, Package, Tag, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  const actions = [
    {
      title: "Add Product",
      description: "Create a new product",
      icon: Plus,
      href: "/dashboard/products/create",
    },
    {
      title: "Manage Inventory",
      description: "Update stock levels",
      icon: Package,
      href: "/dashboard/products/inventory",
    },
    {
      title: "Update Prices",
      description: "Change product prices",
      icon: Tag,
      href: "/dashboard/products/prices",
    },
    {
      title: "View Reports",
      description: "See sales analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks you can perform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto flex-col items-start gap-1 p-4 justify-start"
              asChild
            >
              <Link href={action.href}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <action.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
