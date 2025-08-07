import type { ReactNode } from "react"
import { SiteHeader } from "@/components/site-header"
import { ModernFooter } from "@/components/Footer"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <ModernFooter />
    </div>
  )
}
