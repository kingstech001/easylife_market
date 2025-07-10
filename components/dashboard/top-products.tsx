"use client"

import Image from "next/image"
import { mockProducts } from "@/lib/mock-data"
import { formatPrice } from "@/lib/utils"

interface TopProductsProps {
  limit?: number
}

export function TopProducts({ limit = 5 }: TopProductsProps) {
  // In a real app, we would fetch this data from the API
  const products = mockProducts.slice(0, limit).sort((a, b) => b.price - a.price)

  return (
    <div className="space-y-4">
      {products.map((product) => {
        const mainImage = product.images[0] || { url: "/placeholder.svg?height=40&width=40", alt_text: product.name }

        return (
          <div key={product.id} className="flex items-center gap-4">
            <div className="h-10 w-10 relative rounded overflow-hidden">
              <Image
                src={mainImage.url || "/placeholder.svg"}
                alt={mainImage.alt_text || product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.inventory_quantity} in stock</p>
            </div>
            <div className="font-medium">{formatPrice(product.price)}</div>
          </div>
        )
      })}
    </div>
  )
}
