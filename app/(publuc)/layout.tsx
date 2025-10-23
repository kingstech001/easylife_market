import type { ReactNode } from "react"
import { SiteHeader } from "@/components/site-header"
import { ModernFooter } from "@/components/Footer"
import { CartProvider } from "@/context/cart-context"  // 👈 import your provider
import { AuthProvider } from "@/context/AuthContext"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>   {/* 👈 provide cart context to everything in this layout */}
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <ModernFooter />
        </div>
      </CartProvider>
    </AuthProvider>
  )
}
