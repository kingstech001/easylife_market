"use client"

import Image from "next/image"
import { mockStores } from "@/lib/mock-data"
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder"
import { useEffect, useState } from "react"

interface TopStoresProps {
  limit?: number
}

export function TopStores({ limit = 5 }: TopStoresProps) {
  const [visits, setVisits] = useState<number | null>(null)

  useEffect(() => {
    setVisits(Math.floor(Math.random() * 1000));
  }, [])
  // In a real app, we would fetch this data from the API
  const stores = mockStores.slice(0, limit)

  return (
    <div className="space-y-4">
      {stores.map((store) => (
        <div key={store.id} className="flex items-center gap-4">
          {store.logo_url ? (
            <Image
              src={store.logo_url || "/placeholder.svg"}
              alt={store.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <AvatarPlaceholder name={store.name} className="h-10 w-10" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{store.name}</p>
            <p className="text-sm text-muted-foreground">{store.is_published ? "Active" : "Draft"}</p>
          </div>
          <div className="font-medium">
            {/* This would be real data in a production app */}
            {visits !== null ? `${visits} visits` : "Loading..."}
          </div>
        </div>
      ))}
    </div>
  )
}
