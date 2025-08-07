"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Star, Heart, Loader2 } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  compare_at_price: number | null
  category_id?: string
  inventory_quantity: number
  images: { id: string; url: string; alt_text: string | null }[]
  store_id: string
  created_at: string
  updated_at: string
}

interface ProductCardProps {
  product: Product
  storeSlug: string
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const mainImage = product.images?.[0]
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPercentage = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (product.inventory_quantity === 0) return

    setIsAddingToCart(true)

    // Simulate API call delay
    setTimeout(() => {
      setIsAddingToCart(false)
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.images[0]?.url || "/placeholder.svg",
      })
      // toast.success("Added to cart!", {
      //   description: `${product.name}`,
      // })
    }, 1000)
  }

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const wishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || "/placeholder.svg",
      storeSlug: storeSlug,
    }

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
      toast.success("Removed from wishlist")
    } else {
      addToWishlist(wishlistItem)
      toast.success("Added to wishlist")
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={mainImage?.url || "/placeholder.svg?height=300&width=300&text=Product"}
            alt={mainImage?.alt_text || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />

          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
              -{discountPercentage}%
            </Badge>
          )}

          {product.inventory_quantity <= 5 && product.inventory_quantity > 0 && (
            <Badge variant="secondary" className="absolute top-2 right-2 bg-amber-100 text-amber-800">
              Low Stock
            </Badge>
          )}

          {product.inventory_quantity === 0 && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              Out of Stock
            </Badge>
          )}

          {/* Wishlist Button - Shows on Hover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-2 left-1/2 transform -translate-x-1/2"
          >
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow-md"
              onClick={toggleWishlist}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""}`}
              />
            </Button>
          </motion.div>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="space-y-2 flex-1">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            {product.description && <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>}

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">4.5</span>
              </div>
              <span className="text-xs text-muted-foreground">(24 reviews)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">₦{product.price.toFixed(2)}</span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  ₦{product.compare_at_price!.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Info */}
            <div className="text-xs text-muted-foreground">
              {product.inventory_quantity > 0 ? (
                <span>Stock: {product.inventory_quantity} available</span>
              ) : (
                <span className="text-red-500">Out of stock</span>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex gap-2 w-full">
            <Button asChild variant="outline" className="flex-1 bg-transparent">
              <Link href={`/stores/${storeSlug}/products/${product.id}`}>View Details</Link>
            </Button>

            <Button
              className="flex-1"
              disabled={product.inventory_quantity === 0 || isAddingToCart}
              onClick={handleAddToCart}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : product.inventory_quantity === 0 ? (
                "Out of Stock"
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
