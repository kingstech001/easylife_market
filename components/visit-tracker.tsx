"use client";

import { useEffect, useCallback } from "react";

interface VisitTrackerProps {
  storeId: string;
  userId?: string;
}

export function VisitTracker({ storeId, userId }: VisitTrackerProps) {
  const logVisit = useCallback(async () => {
    try {
      const response = await fetch("/api/stores/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, userId: userId || null }),
      });

      if (!response.ok) {
        console.error("Failed to log visit:", response.statusText);
      }
    } catch (error) {
      console.error("Error logging visit:", error);
    }
  }, [storeId, userId]);

  useEffect(() => {
    logVisit();
  }, [logVisit]);

  return null; // invisible component
}
