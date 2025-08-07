'use client'

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  BarChart3,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"

const sidebarNavItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "All Stores",
    href: "/dashboard/stores",
    icon: Store,
  },
  {
    title: "All Products",
    href: "/dashboard/products",
    icon: ShoppingBag,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Users",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

   const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    toast("Logged out successfully.")
    router.push("/")
    router.refresh()
  }

  return (
    <div className="hidden border-r bg-background md:block">
      <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Users className="h-6 w-6" />
            <span>Admin Panel</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-3 py-2">
          <div className="flex flex-col gap-1">
            {sidebarNavItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "default" : "ghost"}
                className={cn("justify-start", pathname === item.href && "bg-primary text-primary-foreground")}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-auto border-t p-4">
          <div className="flex items-center gap-2 py-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/help">
                <HelpCircle className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
