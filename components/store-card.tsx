// components/store-card.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Package } from "lucide-react"

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
  }
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Link href={`/stores/${store.slug}`} className="block h-full w-full">
      <Card className="relative h-full w-full flex flex-col overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/50 group">
        {/* Banner */}
        <div className="relative w-full h-32 sm:h-40 bg-muted overflow-hidden flex-shrink-0">
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
          {!store.isPublished && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white">
              Draft
            </Badge>
          )}
        </div>

        {/* Logo */}
        {store.logo_url && (
          <div className="absolute z-20 top-24 sm:top-28 left-4 h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-card bg-card shadow-md overflow-hidden flex-shrink-0">
            <Image
              src={store.logo_url}
              alt={`${store.name} logo`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}

        {/* Store Info */}
        <CardHeader className="pt-10 pb-4 flex-grow">
          <CardTitle 
            className="text-lg sm:text-xl font-bold truncate w-full"
            title={store.name} // Shows full name on hover
          >
            {store.name}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {store.description || "No description available."}
          </CardDescription>
        </CardHeader>

        {/* Optional: Product Count Footer */}
        {store.productCount !== undefined && (
          <CardContent className="pt-0 pb-4 mt-auto flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="w-4 h-4" />
              <span>{store.productCount} {store.productCount === 1 ? 'product' : 'products'}</span>
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}