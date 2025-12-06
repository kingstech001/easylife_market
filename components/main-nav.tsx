"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBag } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { cn } from "@/lib/utils"
import Image from "next/image"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  const links = [
    { href: "/", label: "Home" },
    { href: "/stores", label: "Stores" },
    { href: "/about", label: "About" },
  ]

  return (
    <div className="flex gap-6 md:gap-10 items-center">
      <Link href="/" className="inline-flex items-center group">
        <Image alt="" src={"/logo.png"} width={40} height={40}/>
        <div className="">
          <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] bg-clip-text text-transparent">
            EasyLife
          </span>
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