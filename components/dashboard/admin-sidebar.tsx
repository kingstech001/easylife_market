"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Package,
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
  useSidebar,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "sonner"

const sidebarNavItems = [
  {
    title: "Overview",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    title: "All Stores",
    href: "/dashboard/admin/stores",
    icon: Store,
  },
  {
    title: "All Products",
    href: "/dashboard/admin/products",
    icon: Package,
  },
  {
    title: "All Orders",
    href: "/dashboard/admin/orders",
    icon: ShoppingBag,
  },
]

const managementItems = [
  {
    title: "Users",
    href: "/dashboard/admin/users",
    icon: Users,
  },
  
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toggleSidebar } = useSidebar()

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
  const handleSidebarClick = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar()
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
                  <Users className="h-5 w-5" />
                  <span>Admin Panel</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
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
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>System & Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
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
            <div className="flex items-center justify-between w-full px-2 py-1">
              <span className="text-sm font-medium text-sidebar-foreground/70">Sign out</span>
              <div onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4 hover:text-red-700" />
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full px-2 py-1">
              <span className="text-sm font-medium text-sidebar-foreground/70">Theme</span>
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
