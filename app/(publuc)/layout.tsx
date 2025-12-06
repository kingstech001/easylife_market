import { SiteHeader } from "@/components/site-header"
import { ModernFooter } from "@/components/Footer"
import { CartProvider } from "@/context/cart-context"
import { AuthProvider } from "@/context/AuthContext"
import { LocationPrompt } from "@/components/location-prompt"


export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="relative min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1">
            <LocationPrompt />
            {children}
          </main>
          <ModernFooter />
        </div>
      </CartProvider>
    </AuthProvider>
  )
}
