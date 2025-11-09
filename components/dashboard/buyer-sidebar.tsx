"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Settings,
  HelpCircle,
  LogOut,
  Package,
  ShoppingCart,
} from "lucide-react";
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
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { toast } from "sonner";

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
];

const supportItems = [
  {
    title: "Help Center",
    href: "/dashboard/buyer/support",
    icon: HelpCircle,
  },
  // {
  //   title: "Settings",
  //   href: "/dashboard/buyer/settings",
  //   icon: Settings,
  // },
];

export function BuyerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { getTotalItems } = useCart();
  const { getTotalItems: getWishlistItems } = useWishlist();
  const cartItemCount = getTotalItems();
  const wishlistItemCount = getWishlistItems();
  const { toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Logged out successfully.");
        router.push("/");
        router.refresh();
      } else {
        toast.error("Logout failed.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed.");
    }
  };

  // ✅ Function to close sidebar only on mobile
  const handleSidebarClick = () => {
    if (window.innerWidth < 1024) {
      // Tailwind 'lg' breakpoint = 1024px
      toggleSidebar();
    }
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="#" className="flex items-center space-x-2 py-4 px-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#c0a146] to-[#c0a146]/90 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-white font-bold text-sm" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                EasyLife
              </span>
            </Link>
            <SidebarMenuButton>
              <ShoppingBag className="h-5 w-5" />
              <span>Buyer Panel</span>
            </SidebarMenuButton>
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
                  <SidebarMenuButton asChild isActive={pathname === item.href} onClick={handleSidebarClick}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.showBadge && (
                    <SidebarMenuBadge>
                      {item.title === "Cart"
                        ? cartItemCount
                        : wishlistItemCount}
                    </SidebarMenuBadge>
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
            <div
              onClick={handleLogout}
              className="flex items-center justify-between w-full px-2 py-1"
            >
              <span className="text-sm font-medium text-sidebar-foreground/70">
                Sign out
              </span>
              <LogOut className="mr-2 h-4 w-4 hover:text-red-700" />
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full px-2 py-1">
              <span className="text-sm font-medium text-sidebar-foreground/70">
                Theme
              </span>
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
