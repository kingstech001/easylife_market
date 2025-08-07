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
  }
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Link href={`/stores/${store.slug}`} className="block h-full">
      <Card className="relative h-full flex flex-col overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg hover:border-primary/50 group">

        {/* Banner */}
        <div className="relative w-full h-40 bg-muted overflow-hidden">
          {store.banner_url ? (
            <Image
              src={store.banner_url}
              alt={`${store.name} banner`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
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

        {/* Logo (on top of everything) */}
        {store.logo_url && (
          <div className="absolute z-20 top-28 left-4 w-20 h-20 rounded-full border-4 border-card bg-card shadow-md overflow-hidden">
            <Image
              src={store.logo_url}
              alt={`${store.name} logo`}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Store Info */}
        <CardHeader className="pt-10 pb-4">
          <CardTitle className="text-xl font-bold truncate">{store.name}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground line-clamp-2">
            {store.description || "No description available."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>Online</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>4.5</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span>120 Products</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
