"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Store, Package, ShoppingCart, Users, Settings, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface DashboardNavProps extends React.HTMLAttributes<HTMLElement> {}

export function DashboardNav({ className, ...props }: DashboardNavProps) {
  const pathname = usePathname()
  const { toast } = useToast()
  const router = useRouter()

  const handleSignOut = async () => {
    // For development purposes, let's simulate signing out
    // In a real app, we would use Supabase auth

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Remove the authentication cookie
    document.cookie = "authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    })

    router.push("/")
    router.refresh()
  }

  return (
    <nav className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)} {...props}>
      <Link href="/dashboard">
        <Button variant={pathname === "/dashboard" ? "default" : "ghost"} className="w-full justify-start">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/dashboard/stores">
        <Button variant={pathname === "/dashboard/stores" ? "default" : "ghost"} className="w-full justify-start">
          <Store className="mr-2 h-4 w-4" />
          Stores
        </Button>
      </Link>
      <Link href="/dashboard/products">
        <Button variant={pathname === "/dashboard/products" ? "default" : "ghost"} className="w-full justify-start">
          <Package className="mr-2 h-4 w-4" />
          Products
        </Button>
      </Link>
      <Link href="/dashboard/orders">
        <Button variant={pathname === "/dashboard/orders" ? "default" : "ghost"} className="w-full justify-start">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Orders
        </Button>
      </Link>
      <Link href="/dashboard/customers">
        <Button variant={pathname === "/dashboard/customers" ? "default" : "ghost"} className="w-full justify-start">
          <Users className="mr-2 h-4 w-4" />
          Customers
        </Button>
      </Link>
      <Link href="/dashboard/settings">
        <Button variant={pathname === "/dashboard/settings" ? "default" : "ghost"} className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </Link>

      <div className="mt-auto pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </nav>
  )
}
