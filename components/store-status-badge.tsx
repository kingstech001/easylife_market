"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface StoreStatusBadgeProps {
  openTime: string   // "HH:MM" e.g. "09:00"
  closeTime: string  // "HH:MM" e.g. "18:00"
  isOpenToday?: boolean
}

export function StoreStatusBadge({ openTime, closeTime, isOpenToday = true }: StoreStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const checkStoreStatus = () => {
      if (!isOpenToday) {
        setIsOpen(false)
        return
      }

      const now = new Date()
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes()

      const [openH, openM]   = openTime.split(":").map(Number)
      const [closeH, closeM] = closeTime.split(":").map(Number)
      const openTimeInMinutes  = openH * 60 + openM
      const closeTimeInMinutes = closeH * 60 + closeM

      setIsOpen(
        currentTimeInMinutes >= openTimeInMinutes &&
        currentTimeInMinutes < closeTimeInMinutes
      )
    }

    checkStoreStatus()
    const interval = setInterval(checkStoreStatus, 60000)
    return () => clearInterval(interval)
  }, [openTime, closeTime, isOpenToday])

  if (!mounted) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1.5">
        <div className="h-2 w-2 bg-gray-400 rounded-full" />
        Loading...
      </Badge>
    )
  }

  // ✅ Format "HH:MM" → "9:00 AM" properly preserving minutes
  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    const period = h >= 12 ? "PM" : "AM"
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${displayHour}:${String(m).padStart(2, "0")} ${period}`
  }

  return (
    <Badge
      variant="secondary"
      className={`flex items-center gap-1.5 ${
        isOpen
          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900"
          : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900"
      }`}
    >
      <div className={`h-2 w-2 rounded-full ${isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
      {isOpen ? (
        <>
          Open Now
          <span className="text-xs opacity-70">(Closes at {formatTime(closeTime)})</span>
        </>
      ) : (
        <>
          Closed Now
          <span className="text-xs opacity-70">
            {isOpenToday ? `(Opens at ${formatTime(openTime)})` : "(Closed today)"}
          </span>
        </>
      )}
    </Badge>
  )
}