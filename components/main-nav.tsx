import type React from "react"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"

import { cn } from "@/lib/utils"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <div className="flex gap-6 md:gap-10 items-center">
      <Link href="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-[#c0a146] to-[#c0a146]/90 rounded-lg flex items-center justify-center">
          <ShoppingBag className="h-6 w-6 text-white font-bold text-sm" />
        </div>
        <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">EasyLife</span>
      </Link>
      <nav className={cn("md:flex items-center space-x-4 lg:space-x-6 hidden", className)} {...props}>
        <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
          Home
        </Link>
        <Link href="/stores" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          Stores
        </Link>
        <Link href="/about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          About
        </Link>
      </nav>
    </div>
  )
}
