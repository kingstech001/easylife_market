"use client"

import Link from "next/link"
import Image from "next/image"
import { Edit, ExternalLink, MoreHorizontal, Plus } from "lucide-react"
import { Store } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder"
import { mockStores } from "@/lib/mock-data"

export function StoresList() {
  // In a real app, we would fetch this data from the API
  const stores = mockStores.slice(0, 3)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Stores</CardTitle>
          <CardDescription>Manage your e-commerce stores</CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/stores/create">
            <Plus className="mr-2 h-4 w-4" />
            New Store
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stores.map((store) => (
            <div key={store.id} className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                {store.logo_url ? (
                  <Image
                    src={store.logo_url || "/placeholder.svg"}
                    alt={store.name}
                    width={48}
                    height={48}
                    className="rounded-md"
                  />
                ) : (
                  <AvatarPlaceholder name={store.name} className="h-12 w-12" />
                )}
                <div>
                  <p className="font-medium">{store.name}</p>
                  <div className="flex items-center gap-2">
                    {store.is_published ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Draft
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(store.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/stores/${store.slug}`} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View Store</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/stores/${store.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit Store</span>
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
            </div>
          ))}

          {stores.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <Store className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No stores yet</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                You haven't created any stores yet. Create your first store to get started.
              </p>
              <Button asChild>
                <Link href="/dashboard/stores/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Store
                </Link>
              </Button>
            </div>
          )}

          {stores.length > 0 && (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/stores">View All Stores</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
