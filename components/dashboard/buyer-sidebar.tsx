"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  User2,
  Package,
  Star,
  ShoppingCart,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import { toast } from "sonner"

const sidebarNavItems = [
  {
    title: "Overview",
    href: "/dashboard/buyer",
    icon: LayoutDashboard,
  },
  {
    title: "Cart",
    href: "/dashboard/buyer/cart",
    icon: ShoppingCart,
    showBadge: true,
  },
  {
    title: "Orders",
    href: "/dashboard/buyer/orders",
    icon: Package,
  },
  {
    title: "Wishlist",
    href: "/dashboard/buyer/wishlist",
    icon: Heart,
    showBadge: true,
  },
  {
    title: "Payment Methods",
    href: "/dashboard/buyer/payment-methods",
    icon: CreditCard,
  },
]

const supportItems = [
  {
    title: "Reviews",
    href: "/dashboard/buyer/reviews",
    icon: Star,
  },
  {
    title: "Help Center",
    href: "/dashboard/buyer/help",
    icon: HelpCircle,
  },
  {
    title: "Settings",
    href: "/dashboard/buyer/settings",
    icon: Settings,
  },
]

export function BuyerSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { getTotalItems } = useCart()
  const { getTotalItems: getWishlistItems } = useWishlist()
  const cartItemCount = getTotalItems()
  const wishlistItemCount = getWishlistItems()

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      if (res.ok) {
        toast.success("Logged out successfully.")
        router.push("/")
        router.refresh()
      } else {
        toast.error("Logout failed.")
      }
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Logout failed.")
    }
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <ShoppingBag className="h-5 w-5" />
                  <span>Buyer Panel</span>
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-popper-anchor-width)">
                <DropdownMenuItem onClick={() => router.push("/dashboard/buyer")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/")}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  <span>Browse Stores</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/cart")}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <span>Cart ({cartItemCount})</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/buyer/profile")}>
                  <User2 className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/buyer/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/buyer/help")}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Shopping</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.showBadge && (
                    <SidebarMenuBadge>{item.title === "Cart" ? cartItemCount : wishlistItemCount}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Account & Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 className="h-5 w-5" />
                  <span>My Account</span>
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-(--radix-popper-anchor-width)">
                <DropdownMenuItem onClick={() => router.push("/dashboard/buyer/profile")}>
                  <User2 className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/cart")}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  <span>Cart ({cartItemCount})</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/buyer/wishlist")}>
                  <Heart className="mr-2 h-4 w-4" />
                  <span>Wishlist ({wishlistItemCount})</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/buyer/addresses")}>
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Addresses</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/buyer/payment-methods")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Payment Methods</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full px-2 py-1">
              <span className="text-sm font-medium text-sidebar-foreground/70">Theme</span>
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
