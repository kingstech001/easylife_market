import Link from "next/link"
import Image from "next/image"
import { Edit, ExternalLink, MoreHorizontal, ShoppingBag, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
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
    created_at: string
    updated_at: string
  }
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 w-full">
        {store.banner_url ? (
          <Image src={store.banner_url || "/placeholder.svg"} alt={store.name} fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <AvatarPlaceholder name={store.name} className="h-16 w-16 text-xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          {store.is_published ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Draft
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
            <div>
              <h3 className="font-semibold text-lg">{store.name}</h3>
              <p className="text-sm text-muted-foreground">Created {new Date(store.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/stores/${store.id}/edit`}>Edit Store</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/stores/${store.id}/products`}>Manage Products</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/stores/${store.id}/analytics`}>View Analytics</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/stores/${store.id}/settings`}>Store Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" asChild>
                <Link href={`/dashboard/stores/${store.id}/delete`}>Delete Store</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
          {store.description || "No description available"}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between p-6 pt-0">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/stores/${store.id}/products`}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Products
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/stores/${store.id}/analytics`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/stores/${store.slug}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/stores/${store.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
