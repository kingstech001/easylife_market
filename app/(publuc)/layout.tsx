"use client"

import { usePathname } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { ModernFooter } from "@/components/Footer"
import { CartProvider } from "@/context/cart-context"
import { AuthProvider } from "@/context/AuthContext"


export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.includes("auth")

  return (
    <AuthProvider>
      <CartProvider>
        <div className="relative min-h-screen flex flex-col">
          {!isAuthPage && <SiteHeader />}
          <main className="flex-1">
            {children}
          </main>
          {!isAuthPage && <ModernFooter />}
        </div>
      </CartProvider>
    </AuthProvider>
  )
}
