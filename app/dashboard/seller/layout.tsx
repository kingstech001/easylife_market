"use client"

import type React from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { SellerSidebar } from "@/components/dashboard/seller-sidebar"
import { AuthProvider } from "@/context/AuthContext"

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SellerSidebar />
      <SidebarInset>
        <header className="flex  shrink-0 items-center gap-2 border-b p-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
