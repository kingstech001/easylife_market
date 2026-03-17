// components/store-card.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Clock } from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
interface DaySchedule {
  open: boolean
  openTime: string  // "HH:MM"
  closeTime: string // "HH:MM"
}

interface BusinessHours {
  monday:    DaySchedule
  tuesday:   DaySchedule
  wednesday: DaySchedule
  thursday:  DaySchedule
  friday:    DaySchedule
  saturday:  DaySchedule
  sunday:    DaySchedule
}

interface StoreCardProps {
  store: {
    _id: string
    name: string
    slug: string
    description?: string
    logo_url?: string
    banner_url?: string
    isPublished: boolean
    createdAt: string
    updatedAt: string
    productCount?: number
    businessHours?: BusinessHours | null
  }
}

// ── Fallback business hours ───────────────────────────────────────────────────
const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday:    { open: true,  openTime: "09:00", closeTime: "20:00" },
  tuesday:   { open: true,  openTime: "09:00", closeTime: "20:00" },
  wednesday: { open: true,  openTime: "09:00", closeTime: "20:00" },
  thursday:  { open: true,  openTime: "09:00", closeTime: "20:00" },
  friday:    { open: true,  openTime: "09:00", closeTime: "20:00" },
  saturday:  { open: true,  openTime: "09:00", closeTime: "20:00" },
  sunday:    { open: false, openTime: "09:00", closeTime: "20:00" },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DAY_KEYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const
type DayKey = typeof DAY_KEYS[number]

const DAY_LABELS: Record<DayKey, string> = {
  sunday:    "Sun",
  monday:    "Mon",
  tuesday:   "Tue",
  wednesday: "Wed",
  thursday:  "Thu",
  friday:    "Fri",
  saturday:  "Sat",
}

function isValidSchedule(s: any): s is DaySchedule {
  return (
    s &&
    typeof s.open === "boolean" &&
    typeof s.openTime === "string" &&
    typeof s.closeTime === "string"
  )
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number)
  const suffix = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return m === 0
    ? `${hour}${suffix}`
    : `${hour}:${m.toString().padStart(2, "0")}${suffix}`
}

// ✅ Merge DB hours with DEFAULT — any missing/invalid day falls back to default
function resolveBusinessHours(businessHours?: BusinessHours | null): BusinessHours {
  if (!businessHours) return DEFAULT_BUSINESS_HOURS

  const resolved = {} as BusinessHours
  for (const key of Object.keys(DEFAULT_BUSINESS_HOURS) as DayKey[]) {
    const dbDay = (businessHours as any)[key]
    resolved[key] = isValidSchedule(dbDay) ? dbDay : DEFAULT_BUSINESS_HOURS[key]
  }
  return resolved
}

function getStoreStatus(businessHours?: BusinessHours | null): {
  isOpen: boolean
  label: string
  sublabel?: string
} {
  // ✅ Always resolve — never undefined
  const hours = resolveBusinessHours(businessHours)

  const now = new Date()
  const todayIndex = now.getDay() // 0 = Sunday
  const todayKey = DAY_KEYS[todayIndex]
  const today = hours[todayKey]

  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Store is open today
  if (today.open) {
    const openMins  = parseMinutes(today.openTime)
    const closeMins = parseMinutes(today.closeTime)

    // Currently within open hours
    if (currentMinutes >= openMins && currentMinutes < closeMins) {
      return {
        isOpen: true,
        label: `Open until ${formatTime(today.closeTime)}`,
      }
    }

    // Today but not yet open
    if (currentMinutes < openMins) {
      return {
        isOpen: false,
        label: `Opens at ${formatTime(today.openTime)}`,
      }
    }
  }

  // Closed today or past closing — find next open day
  for (let i = 1; i <= 7; i++) {
    const nextIndex = (todayIndex + i) % 7
    const nextKey = DAY_KEYS[nextIndex]
    const next = hours[nextKey]

    if (next.open) {
      const dayLabel = i === 1 ? "tomorrow" : DAY_LABELS[nextKey]
      return {
        isOpen: false,
        label: `Opens ${dayLabel}`,
        sublabel: formatTime(next.openTime),
      }
    }
  }

  // No open days found at all
  return { isOpen: false, label: "Closed" }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function StoreCard({ store }: StoreCardProps) {
  const status = getStoreStatus(store.businessHours)

  return (
    <Link href={`/stores/${store.slug}`} className="block h-full w-full">
      <Card className="relative h-full w-full flex flex-col overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/50 group">

        {/* ── Banner ────────────────────────────────────────────────────────── */}
        <div className="relative w-full h-28 bg-muted overflow-hidden flex-shrink-0">
          {store.banner_url ? (
            <Image
              src={store.banner_url}
              alt={`${store.name} banner`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 280px, (max-width: 1024px) 50vw, 25vw"
              priority={false}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/60 text-sm">
              No Banner Image
            </div>
          )}

          {/* ✅ Closed overlay — dark + pill */}
          {!status.isOpen && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
                <span className="text-white text-xs font-semibold">
                  {status.label}
                </span>
                {status.sublabel && (
                  <span className="text-white/70 text-xs">
                    · {status.sublabel}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ✅ Open pill — bottom left, only when open */}
          {status.isOpen && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-green-500/90 backdrop-blur-sm rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse flex-shrink-0" />
              <span className="text-white text-[10px] font-semibold">
                {status.label}
              </span>
            </div>
          )}

          {/* Draft badge */}
          {!store.isPublished && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white">
              Draft
            </Badge>
          )}
        </div>

        {/* ── Logo ──────────────────────────────────────────────────────────── */}
        {store.logo_url && (
          <div className="absolute z-20 top-20 left-4 h-16 w-16 rounded-full border-4 border-card bg-card shadow-md overflow-hidden flex-shrink-0">
            <Image
              src={store.logo_url}
              alt={`${store.name} logo`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}

        {/* ── Store Info ────────────────────────────────────────────────────── */}
        <CardHeader className="pt-10 pb-4 flex-grow px-3">
          <CardTitle
            className="text-lg sm:text-xl font-bold truncate w-full"
            title={store.name}
          >
            {store.name}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {store.description || "No description available."}
          </CardDescription>
        </CardHeader>

        {/* ── Product Count ─────────────────────────────────────────────────── */}
        {store.productCount !== undefined && (
          <CardContent className="pt-0 pb-4 mt-auto flex-shrink-0 px-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="w-4 h-4" />
              <span>
                {store.productCount}{" "}
                {store.productCount === 1 ? "product" : "products"}
              </span>
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}