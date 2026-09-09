"use client"

import type React from "react"

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { BuyerSidebar } from "@/components/dashboard/buyer-sidebar"

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {

  return (
    <SidebarProvider>
      <BuyerSidebar />
      <SidebarInset className="min-w-0 max-w-full overflow-x-clip">
        <header className="flex h-14 min-w-0 shrink-0 items-center gap-2 border-b px-4 sm:h-16">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex min-w-0 max-w-full flex-1 flex-col gap-4 overflow-x-clip p-3 sm:p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
