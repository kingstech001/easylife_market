"use client"

import type React from "react"

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { SellerSidebar } from "@/components/dashboard/seller-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import { Fragment } from "react"

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Function to generate breadcrumbs from the pathname
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter((segment) => segment !== "")
    const breadcrumbs = []
    let currentPath = ""

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      currentPath += `/${segment}/seller`
      const isLast = i === pathSegments.length - 1
      const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ") // Capitalize and replace hyphens

      breadcrumbs.push(
        <Fragment key={currentPath}>
          <BreadcrumbItem>
            {isLast ? (
              <BreadcrumbPage>{title}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink href={currentPath}>{title}</BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {!isLast && <BreadcrumbSeparator />}
        </Fragment>,
      )
    }
    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <SidebarProvider>
      <SellerSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>{breadcrumbs}</BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
