"use client"

import { useEffect } from "react"

interface VisitTrackerProps {
  storeId: string
  userId?: string
}

export function VisitTracker({ storeId, userId }: VisitTrackerProps) {
  useEffect(() => {
    const logVisit = async () => {
      try {
        const response = await fetch("/api/stores/visit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storeId,
            userId: userId || null,
          }),
        })

        if (!response.ok) {
          console.error("Failed to log visit:", response.statusText)
        }
      } catch (error) {
        console.error("Error logging visit:", error)
      }
    }

    logVisit()
  }, [storeId, userId])

  // This component doesn't render anything visible
  return null
}
