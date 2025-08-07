"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import Link from "next/link"
import { MoreHorizontal, Edit, Trash2, Copy, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"

// Updated Product type to match your transformed data structure
export type Product = {
  id: string
  name: string
  description?: string
  price: number
  compare_at_price?: number
  category?: string
  inventory_quantity: number
  images?: { url: string; altText?: string }[]
  store_id: string
  created_at: string
  updated_at: string
  status?: "active" | "draft" | "archived"
}

export const columns: ColumnDef<Product>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original
      const mainImage = product.images?.[0] || { url: "/placeholder.svg?height=40&width=40", altText: product.name }

      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 relative rounded overflow-hidden bg-muted">
            <Image
              src={mainImage.url || "/placeholder.svg?height=40&width=40"}
              alt={mainImage.altText || product.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{product.name}</div>
            {product.description && (
              <div className="text-sm text-muted-foreground truncate max-w-[200px]">{product.description}</div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as string
      return <div className="text-sm">{category || "Uncategorized"}</div>
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = Number.parseFloat(row.getValue("price"))
      const compareAtPrice = row.original.compare_at_price

      return (
        <div className="text-right">
          <div className="font-medium">{formatPrice(price)}</div>
          {compareAtPrice && compareAtPrice > price && (
            <div className="text-sm text-muted-foreground line-through">{formatPrice(compareAtPrice)}</div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "inventory_quantity",
    header: "Inventory",
    cell: ({ row }) => {
      const inventory = Number.parseInt(row.getValue("inventory_quantity"))

      return (
        <div>
          {inventory > 10 ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              In Stock ({inventory})
            </Badge>
          ) : inventory > 0 ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Low Stock ({inventory})
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
              Out of Stock
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string

      return (
        <div>
          {status === "active" ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Active
            </Badge>
          ) : status === "draft" ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Draft
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              Archived
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return <div className="text-sm text-muted-foreground">{date.toLocaleDateString()}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const product = row.original

      const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this product?")) {
          try {
            const response = await fetch(`/api/seller/products/${product.id}`, {
              method: "DELETE",
            })

            if (response.ok) {
              // Refresh the page or update the data
              window.location.reload()
            } else {
              alert("Failed to delete product")
            }
          } catch (error) {
            console.error("Error deleting product:", error)
            alert("Failed to delete product")
          }
        }
      }

      const handleDuplicate = async () => {
        try {
          const response = await fetch(`/api/seller/products/${product.id}/duplicate`, {
            method: "POST",
          })

          if (response.ok) {
            // Refresh the page or update the data
            window.location.reload()
          } else {
            alert("Failed to duplicate product")
          }
        } catch (error) {
          console.error("Error duplicating product:", error)
          alert("Failed to duplicate product")
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/seller/products/${product.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/seller/products/${product.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
