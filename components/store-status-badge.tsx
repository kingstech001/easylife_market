"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface StoreStatusBadgeProps {
  openTime: number // Opening hour in 24-hour format (e.g., 9 for 9 AM)
  closeTime: number // Closing hour in 24-hour format (e.g., 21 for 9 PM)
}

export function StoreStatusBadge({ openTime, closeTime }: StoreStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const checkStoreStatus = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinutes = now.getMinutes()
      const currentTimeInMinutes = currentHour * 60 + currentMinutes
      
      const openTimeInMinutes = openTime * 60
      const closeTimeInMinutes = closeTime * 60
      
      setIsOpen(currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes)
    }

    // Check immediately
    checkStoreStatus()

    // Update every minute
    const interval = setInterval(checkStoreStatus, 60000)

    return () => clearInterval(interval)
  }, [openTime, closeTime])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Badge
        variant="secondary"
        className="flex items-center gap-1.5"
      >
        <div className="h-2 w-2 bg-gray-400 rounded-full" />
        Loading...
      </Badge>
    )
  }

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:00 ${period}`
  }

  return (
    <Badge
      variant="secondary"
      className={`flex items-center gap-1.5 ${
        isOpen 
          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900' 
          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900'
      }`}
    >
      <div 
        className={`h-2 w-2 rounded-full ${
          isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
      />
      {isOpen ? (
        <>
          Open Now
          <span className="text-xs opacity-70">
            (Closes at {formatTime(closeTime)})
          </span>
        </>
      ) : (
        <>
          Closed Now
          <span className="text-xs opacity-70">
            (Opens at {formatTime(openTime)})
          </span>
        </>
      )}
    </Badge>
  )
}