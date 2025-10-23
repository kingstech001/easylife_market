"use client"

import Image from "next/image"
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder"
import { useEffect, useState } from "react"

interface Store {
  _id: string
  name: string
  logo_url?: string
  isPublished: boolean
  visits?: number
}

interface TopStoresProps {
  limit?: number
}

export function TopStores({ limit = 5 }: TopStoresProps) {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch(`/api/dashboard/admin/analytics/top-stores?limit=${limit}`)
        if (!res.ok) throw new Error("Failed to fetch stores")
        const data = await res.json()
        setStores(data.stores || [])
      } catch (error) {
        console.error("Error fetching top stores:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [limit])

  if (loading) {
    return <p>Loading top stores...</p>
  }

  if (stores.length === 0) {
    return <p>No stores available.</p>
  }

  return (
    <div className="space-y-4">
      {stores.map((store) => (
        <div key={store._id} className="flex items-center gap-4">
          {store.logo_url ? (
            <Image
              src={store.logo_url}
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
            <p className="text-sm text-muted-foreground">
              {store.isPublished ? "Active" : "Draft"}
            </p>
          </div>
          <div className="font-medium">
            {store.visits !== undefined ? `${store.visits} visits` : "0 visits"}
          </div>
        </div>
      ))}
    </div>
  )
}
