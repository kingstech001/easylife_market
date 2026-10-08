"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import Image from "next/image"

const links = [
  { href: "/", label: "Home" },
  { href: "/stores", label: "Stores" },
  { href: "/allStoreProducts", label: "Products" },
  { href: "/about", label: "About" },
]

type Indicator = { left: number; width: number }

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [hovered, setHovered] = useState<number | null>(null)
  const [indicator, setIndicator] = useState<Indicator | null>(null)
  // Skip the slide animation on first paint so it doesn't fly in from the left
  const [ready, setReady] = useState(false)

  // Home only matches exactly; other links stay active on their sub-pages
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : !!pathname?.startsWith(href)

  const activeIndex = links.findIndex((link) => isActive(link.href))

  // The highlight follows the hovered link, and rests on the active page otherwise
  const targetIndex = hovered ?? (activeIndex >= 0 ? activeIndex : null)

  const measure = useCallback(() => {
    const el = targetIndex !== null ? itemRefs.current[targetIndex] : null
    setIndicator(el ? { left: el.offsetLeft, width: el.offsetWidth } : null)
  }, [targetIndex])

  useEffect(() => {
    measure()
  }, [measure, pathname])

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Re-measure on resize (font load / breakpoint changes)
  useEffect(() => {
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [measure])

  return (
    <div className="flex items-center gap-3 md:gap-8">
      <Link
        href="/"
        aria-label="EasyLife home"
        className="group inline-flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <Image
          alt="EasyLife Logo"
          src="/logo.png"
          width={50}
          height={50}
          priority
          className="drop-shadow-lg transition-transform duration-200 group-hover:scale-105"
        />
      </Link>

      <nav
        aria-label="Main"
        onMouseLeave={() => setHovered(null)}
        className={cn("relative hidden items-center md:flex", className)}
        {...props}
      >
        {/* Sliding highlight */}
        {indicator && (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 rounded-full border border-white/30 bg-white/15",
              ready &&
                "transition-[left,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            )}
            style={{ left: indicator.left, width: indicator.width }}
          />
        )}

        {links.map((link, index) => {
          const active = isActive(link.href)
          const lit = targetIndex === index
          return (
            <Link
              key={link.href}
              href={link.href}
              ref={(el) => {
                itemRefs.current[index] = el
              }}
              aria-current={active ? "page" : undefined}
              onMouseEnter={() => setHovered(index)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
              className={cn(
                "relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
                "focus-visible:outline-none",
                lit || active ? "text-white" : "text-white/70",
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