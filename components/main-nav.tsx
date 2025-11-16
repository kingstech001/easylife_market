"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBag } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { cn } from "@/lib/utils"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "Home" },
    { href: "/stores", label: "Stores" },
    { href: "/about", label: "About" },
  ]

  return (
    <div className="flex gap-6 md:gap-10 items-center">
      <Link href="/" className="inline-flex items-center space-x-3 group">
        <div className="relative">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#c0a146] to-[#d4b55e] rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:shadow-[#c0a146]/25 transition-all duration-300 group-hover:scale-110">
            <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5">
            <div className="w-2 h-2 bg-emerald-500 rounded-full border border-background animate-pulse" />
          </div>
        </div>
        <div className="space-y-0.5">
          <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] bg-clip-text text-transparent">
            EasyLife
          </span>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[8px] px-1 py-0 border-[#c0a146]/30 text-[#c0a146] hidden sm:flex">
              TRUSTED
            </Badge>
          </div>
        </div>
      </Link>
      <nav className={cn("md:flex items-center space-x-4 lg:space-x-6 hidden", className)} {...props}>
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#c0a146]",
                isActive
                  ? "text-[#c0a146] font-semibold"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}