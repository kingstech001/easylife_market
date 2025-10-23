"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ShoppingCart, User, Menu, X, Heart, LogOut, LogIn, LayoutDashboard, Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import CartOverlay from "./CartOverlay"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [dashboardLink, setDashboardLink] = useState("/dashboard")
  const { state } = useCart()
  const { state: wishlistState } = useWishlist()

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
  const wishlistCount = wishlistState.wishlist.length

  // Don't show cart and wishlist for sellers
  const showShoppingFeatures = userRole !== "seller"

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/me", { cache: "no-store" })
      const data = await res.json()
      if (data?.user) {
        setAuthenticated(true)
        const role = data.user.role
        setUserRole(role)
        if (role === "buyer") setDashboardLink("/dashboard/buyer")
        else if (role === "seller") setDashboardLink("/dashboard/seller")
        else if (role === "admin") setDashboardLink("/dashboard/admin")
      } else {
        setAuthenticated(false)
        setUserRole(null)
      }
    }
    checkAuth()
  }, [pathname])

  async function handleLogout() {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    if (res.ok) {
      toast.success("Logged out")
      setAuthenticated(false)
      setUserRole(null)
      router.push("/")
      router.refresh()
    } else {
      toast.error("Logout failed")
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Main Nav */}
            <div className="flex items-center gap-6">
              <MainNav />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <nav className="flex items-center space-x-1">
                {/* Search Button */}
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>

                {/* Shopping Features - Only for non-sellers */}
                {showShoppingFeatures && (
                  <>
                    {/* Wishlist */}
                    <div className="relative">
                      <Link href="/wishlist">
                        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                          <Heart className="h-4 w-4" />
                          <span className="sr-only">Wishlist</span>
                          {wishlistCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-medium animate-in zoom-in-50"
                            >
                              {wishlistCount > 99 ? "99+" : wishlistCount}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                    </div>

                    {/* Cart */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 relative"
                        onClick={() => setCartOpen(true)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span className="sr-only">Shopping cart</span>
                        {itemCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-medium animate-in zoom-in-50"
                          >
                            {itemCount > 99 ? "99+" : itemCount}
                          </Badge>
                        )}
                      </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6 mx-2" />
                  </>
                )}

                {/* Notifications - Only for authenticated users */}
                {authenticated && (
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Notifications</span>
                  </Button>
                )}

                {/* Auth Actions */}
                {authenticated ? (
                  <div className="flex items-center space-x-1">
                    <Link href={dashboardLink}>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="sr-only">Dashboard</span>
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Link href="/auth/login">
                      <Button variant="ghost" size="sm" className="h-9 px-3">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button size="sm" className="h-9 px-3">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}

                <Separator orientation="vertical" className="h-6 mx-2" />
                <ThemeToggle />
              </nav>
            </div>

            {/* Mobile Toggle */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={cn(
              "fixed inset-x-0 top-16 z-50 h-[calc(100vh-4rem)] bg-background/95 backdrop-blur-lg border-b md:hidden transition-all duration-700 ease-in-out",
              mobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none",
            )}
          >
            <div className="container mx-auto px-4 py-6">
              {/* Navigation Links */}
              <div className="space-y-1 mb-6">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Home
                </Link>
                <Link
                  href="/stores"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Stores
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  About
                </Link>
              </div>

              <Separator className="my-6" />

              {/* Action Buttons */}
              <div className="space-y-4">
                {/* Search */}
                <Button
                  variant="outline"
                  className="w-full justify-start h-11 bg-transparent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Search className="mr-3 h-4 w-4" />
                  Search
                </Button>

                {/* Shopping Features - Only for non-sellers */}
                {showShoppingFeatures && (
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start h-11 relative bg-transparent">
                        <Heart className="mr-3 h-4 w-4" />
                        Wishlist
                        {wishlistCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                          >
                            {wishlistCount > 99 ? "99+" : wishlistCount}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-11 relative bg-transparent"
                      onClick={() => {
                        setCartOpen(true)
                        setMobileMenuOpen(false)
                      }}
                    >
                      <ShoppingCart className="mr-3 h-4 w-4" />
                      Cart
                      {itemCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                        >
                          {itemCount > 99 ? "99+" : itemCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                )}

                {/* Auth Actions */}
                {authenticated ? (
                  <div className="space-y-3">
                    {authenticated && (
                      <Button
                        variant="outline"
                        className="w-full justify-start h-11 bg-transparent"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Bell className="mr-3 h-4 w-4" />
                        Notifications
                      </Button>
                    )}
                    <Link href={dashboardLink} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start h-11 bg-transparent">
                        <LayoutDashboard className="mr-3 h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      className="w-full justify-start h-11"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleLogout()
                      }}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start h-11 bg-transparent">
                        <LogIn className="mr-3 h-4 w-4" />
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full justify-start h-11">
                        <User className="mr-3 h-4 w-4" />
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Theme Toggle */}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Overlay */}
      {cartOpen && <CartOverlay onClose={() => setCartOpen(false)} />}

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
