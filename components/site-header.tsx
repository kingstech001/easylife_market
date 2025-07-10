'use client'

import Link from "next/link"
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Heart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"
import { cn } from "@/lib/utils"
import CartOverlay from "./CartOverlay"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  const { state } = useCart()
  const { state: wishlistState } = useWishlist()

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
  const wishlistCount = wishlistState.wishlist.length

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background ">
        <div className='max-w-[1280px] w-full m-auto px-6 sm:px-8'>
          <div className="flex-1 flex h-16 items-center justify-between">
            {/* Logo and Desktop Nav */}
            <div className="flex items-center gap-4">
              <MainNav />
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <nav className="flex items-center space-x-2">
                {/* Wishlist with badge */}
                <div className="relative">
                  <Link href="/wishlist">
                    <Button variant="ghost" size="icon">
                      <Heart className="h-5 w-5" />
                      <span className="sr-only">wishlist</span>
                    </Button>
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 text-[11px] font-medium w-5 h-5 rounded-full flex items-center justify-center animate-badge
    bg-black text-white dark:bg-white dark:text-black">
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </span>
                    )}
                  </Link>
                </div>

                {/* Cart with badge */}
                <div className="relative">
                  <Button variant="ghost" size="icon" onClick={() => setCartOpen(true)}>
                    <ShoppingCart className="h-5 w-5" />
                    <span className="sr-only">Cart</span>
                  </Button>
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-white text-[11px] font-medium w-5 h-5 rounded-full flex items-center justify-center bg-destructive dark:bg-red-500 animate-badge">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </div>

                <Link href="/dashboard">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Account</span>
                  </Button>
                </Link>

                <ThemeToggle />
              </nav>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </div>
          </div>

          {/* Slide-in Mobile Menu */}
          <div
            className={cn(
              "fixed top-16 right-0 h-[calc(100vh-64px)] w-3/4 max-w-xs bg-background shadow-lg border-l z-50 transform transition-transform duration-300 ease-in-out md:hidden",
              mobileMenuOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className="flex flex-col px-4 py-6 space-y-4">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium">
                Home
              </Link>
              <Link href="/stores" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium">
                Stores
              </Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium">
                About
              </Link>

              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center space-x-6">
                  {/* Wishlist badge */}
                  <div className="relative">
                    <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)}>
                      <Heart className="h-5 w-5" />
                      <span className="sr-only">Wishlist</span>
                    </Link>
                    {wishlistCount > 0 && (
                      <span className="absolute -top-3 -right-5 text-[11px] font-medium w-5 h-5 rounded-full flex items-center justify-center animate-badge
    bg-black text-white dark:bg-white dark:text-black">
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </span>
                    )}
                  </div>

                  {/* Cart badge */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setCartOpen(true)
                        setMobileMenuOpen(false)
                      }}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span className="sr-only">Cart</span>
                    </button>
                    {itemCount > 0 && (
                      <span className="absolute -top-3 -right-5  text-white text-[11px] font-medium w-5 h-5 rounded-full flex items-center justify-center bg-destructive dark:bg-red-500 animate-badge">
                        {itemCount > 99 ? '99+' : itemCount}
                      </span>
                    )}
                  </div>

                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <User className="h-5 w-5" />
                  </Link>

                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Overlay */}
      {cartOpen && <CartOverlay onClose={() => setCartOpen(false)} />}
    </>
  )
}
