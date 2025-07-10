"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/utils"
import { useCart } from "@/context/cart-context"

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string | null
    price: number
    compare_at_price: number | null
    images: {
      id: string
      url: string
      alt_text: string | null
    }[]
  }
  storeSlug: string
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const { addToCart } = useCart()

  const mainImage = product.images[0] || { url: "/placeholder.svg", alt_text: product.name }
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: mainImage.url,
      quantity: 1,
    })
  }

  return (
    <Card className="flex flex-col h-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Product Image */}
      <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden">
        <Image
          src={mainImage.url}
          alt={mainImage.alt_text || product.name}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-md shadow">
            {Math.round((1 - product.price / product.compare_at_price!) * 100)}% OFF
          </div>
        )}
      </div>

      {/* Product Info */}
      <CardContent className="p-3 sm:p-4 flex-grow flex flex-col">
        <h3 className="text-sm sm:text-base font-semibold line-clamp-1">{product.name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
          {product.description || "No description available"}
        </p>
      </CardContent>

      {/* Footer with price & buttons */}
      <CardFooter className="p-3 sm:p-4 pt-0 flex justify-between items-center gap-2">
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-medium">{formatPrice(product.price)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Link href={`/stores/${storeSlug}/products/${product.id}`}>
            <Button
              size="sm"
              className="rounded-xl p-2 flex items-center justify-center"
            >
              View Product Detail
              <span className="sr-only">view product details</span>
            </Button>
          </Link>
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="rounded-full h-9 w-9 p-0 flex items-center justify-center"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="sr-only">Add to cart</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
