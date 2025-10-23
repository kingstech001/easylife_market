"use client"

import type React from "react"

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { BuyerSidebar } from "@/components/dashboard/buyer-sidebar"

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {

  return (
    <SidebarProvider>
      <BuyerSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
