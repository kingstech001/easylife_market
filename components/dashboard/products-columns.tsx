"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import Link from "next/link"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"

export type Product = {
  id: string
  store_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  compare_at_price: number | null
  inventory_quantity: number
  is_published: boolean
  images: {
    id: string
    url: string
    alt_text: string | null
  }[]
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
      const mainImage = product.images[0] || { url: "/placeholder.svg?height=40&width=40", alt_text: product.name }

      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 relative rounded overflow-hidden">
            <Image
              src={mainImage.url || "/placeholder.svg"}
              alt={mainImage.alt_text || product.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="font-medium">{product.name}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = Number.parseFloat(row.getValue("price"))
      const compareAtPrice = row.original.compare_at_price

      return (
        <div>
          <div className="font-medium">{formatPrice(price)}</div>
          {compareAtPrice && (
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
    accessorKey: "is_published",
    header: "Status",
    cell: ({ row }) => {
      const isPublished = row.getValue("is_published")

      return (
        <div>
          {isPublished ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Published
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Draft
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original

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
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/products/${product.id}/duplicate`}>Duplicate</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" asChild>
              <Link href={`/dashboard/products/${product.id}/delete`}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
