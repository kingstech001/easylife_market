"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { ExternalLink, MoreHorizontal, ShoppingBag, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder"
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal"
import { toast } from "sonner"
import { useRouter } from "next/navigation"


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
    isApproved: boolean
  }
}

export function StoreCard({ store }: StoreCardProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const router = useRouter()


  async function handleApprove() {
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard/admin/stores/approve-store/${store.id}`, { method: "PATCH" })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to approve store")
      toast.success("Store approved successfully")
      // Optionally reload the page or trigger a parent refresh
    } catch (err: any) {
      toast.error(err.message || "Error approving store")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
  try {
    setLoading(true)
    const res = await fetch(`/api/dashboard/admin/stores/delete-store/${store.id}`, {
      method: "DELETE",
    })
    const data = await res.json()

    if (!res.ok) throw new Error(data.message || "Failed to delete store")

    toast.success("Store deleted successfully")
    router.refresh()

  } catch (err: any) {
    toast.error(err.message || "Error deleting store")
  } finally {
    setLoading(false)
  }
}


  return (
    <>
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={async () => {
          await handleDelete()
          setShowDeleteModal(false)
        }}
        title={`Delete Store`}
        description={`Are you sure you want to delete "${store.name}"? This action is not reversible.`}
        loading={loading}
      />

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
            {store.isApproved ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Approved
              </Badge>
            ) : null}
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
                <Button variant="ghost" size="icon" disabled={loading}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-green-500 cursor-pointer"
                  onClick={handleApprove}
                  disabled={loading}
                  aria-disabled={store.isApproved}
                >
                  {store.isApproved ? "Approved" : "Approve Store"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive cursor-pointer"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={loading}
                >
                  Delete Store
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
            {store.description || "No description available"}
          </p>
        </CardContent>
        <CardFooter className="p-3 pt-0 flex   justify-between gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/admin/stores/${store.id}/products`}>
              <ShoppingBag className="h-4 w-4" />
              Products
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/admin/stores/${store.id}/analytics`}>
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/stores/${store.slug}`} target="_blank">
              <ExternalLink className="h-4 w-4" />
              Visit
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
