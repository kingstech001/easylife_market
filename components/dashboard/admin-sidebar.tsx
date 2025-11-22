"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Package,
  ChevronRight,
  Shield,
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
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useState, useEffect } from "react"

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
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }
    fetchUser()
  }, [])

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

  const getUserInitials = (name?: string) => {
    if (!name) return "A"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40 bg-gradient-to-b from-muted/30 to-transparent px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard/admin" className="flex items-center gap-3 py-4 group">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-[#c0a146] via-[#d4b55e] to-[#c0a146] rounded-xl flex items-center justify-center shadow-lg shadow-[#c0a146]/20 transition-transform group-hover:scale-105">
                  <Shield className="h-4 w-4 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  EasyLife
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">Admin Dashboard</span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {sidebarNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      onClick={handleSidebarClick}
                      className={`
                        relative h-9 px-2.5 rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-[#c0a146]/10 text-[#c0a146] font-semibold shadow-sm hover:bg-[#c0a146]/15' 
                          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        }
                      `}
                    >
                      <Link href={item.href} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                          <span className="text-[13px]">{item.title}</span>
                        </div>
                        {isActive && (
                          <ChevronRight className="h-3.5 w-3.5 text-[#c0a146] flex-shrink-0" strokeWidth={2.5} />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-3" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            System & Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {managementItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      onClick={handleSidebarClick}
                      className={`
                        h-9 px-2.5 rounded-lg transition-all duration-200
                        ${isActive
                          ? 'bg-[#c0a146]/10 text-[#c0a146] font-semibold'
                          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        }
                      `}
                    >
                      <Link href={item.href} className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-[13px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 bg-gradient-to-t from-muted/30 to-transparent p-3">
        <SidebarMenu className="gap-2">
          {/* User Profile Section */}
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-muted/50 border border-border/40">
              <Avatar className="h-8 w-8 border-2 border-[#c0a146]/20 flex-shrink-0">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-[#c0a146] to-[#c0a146]/80 text-white text-[10px] font-semibold">
                  {getUserInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">
                  {user?.name || "Admin"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user?.email || "admin@example.com"}
                </p>
              </div>
            </div>
          </SidebarMenuItem>

          <Separator />

          {/* Theme Toggle */}
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="text-[13px] font-medium text-muted-foreground">Appearance</span>
              <ThemeToggle />
            </div>
          </SidebarMenuItem>

          {/* Logout Button */}
          <SidebarMenuItem>
            <button
              onClick={handleLogout}
              className="flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all group"
            >
              <span>Sign out</span>
              <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}