import Link from "next/link"
import Image from "next/image"
import { ExternalLink } from "lucide-react"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder"

interface StoreCardProps {
  store: {
    id: string
    name: string
    slug: string
    description: string | null
    logo_url: string | null
    banner_url: string | null
    is_published: boolean
  }
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Card className="overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col w-full max-w-full">
      {/* Banner */}
      <div className="relative h-32 sm:h-40 w-full">
        {store.banner_url ? (
          <Image
            src={store.banner_url}
            alt={store.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <AvatarPlaceholder name={store.name} className="h-16 w-9 text-xl sm:h-20 sm:w-20 sm:text-2xl" />
          </div>
        )}
      </div>

      {/* Store Info */}
      <CardContent className="p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt={store.name}
                width={32}
                height={32}
                className="rounded-full object-cover sm:w-10 sm:h-10"
              />
            ) : (
              <AvatarPlaceholder name={store.name} className="h-8 w-8 sm:h-10 sm:w-10 text-sm sm:text-base" />
            )}
            <div>
              <h3 className="font-semibold text-sm sm:text-base">{store.name}</h3>
              <Badge
                variant="outline"
                className={`mt-1 text-xs sm:text-sm ${
                  store.is_published
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {store.is_published ? "Active" : "Draft"}
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
          {store.description || "No description available"}
        </p>
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-3 sm:p-4 pt-0">
        <Button
          asChild
          variant="outline"
          className="w-full sm:w-auto text-sm sm:text-base px-3 py-2 sm:px-4"
        >
          <Link href={`/stores/${store.slug}`}>
            Visit Store
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
