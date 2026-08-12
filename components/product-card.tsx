"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Heart, Loader2 } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import { toast } from "sonner"
import { useFormatAmount } from "@/hooks/useFormatAmount"

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
  hasVariants?: boolean
  hasModifiers?: boolean
  variants?: Array<{
    color: { 
      name: string
      hex: string
      _id?: string
    }
    sizes: Array<{ 
      size: string
      quantity: number
      _id?: string
    }>
    priceAdjustment?: number
    _id?: string
  }> | string // Could be string if not parsed
}

interface ProductCardProps {
  product: Product
  storeSlug: string
  isRestaurant?: boolean
}

export function ProductCard({ product, storeSlug, isRestaurant = false }: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { formatAmount } = useFormatAmount()

  const mainImage = product.images?.[0]
  const productHref = `/stores/${storeSlug}/products/${product.id}`
  const needsCustomization = product.hasModifiers
  const shouldOpenProductPage = needsCustomization || product.hasVariants
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price

  if (product.inventory_quantity <= 0) {
    return null
  }
  // Parse variants if they come as a string
  let parsedVariants: Array<{
    color: { name: string; hex: string; _id?: string }
    sizes: Array<{ size: string; quantity: number; _id?: string }>
    priceAdjustment?: number
    _id?: string
  }> | undefined

  try {
    if (typeof product.variants === 'string') {
      console.log('⚠️ Variants is a STRING, attempting to parse...')
      parsedVariants = JSON.parse(product.variants)
      console.log('✅ Successfully parsed variants:', parsedVariants)
    } else if (Array.isArray(product.variants)) {
      parsedVariants = product.variants
      console.log('✅ Variants is already an array:', parsedVariants)
    } else {
      console.log('❌ Variants is neither string nor array:', typeof product.variants, product.variants)
    }
  } catch (error) {
    console.error('❌ Error parsing variants:', error)
    console.log('Raw variants value:', product.variants)
  }

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
        storeId: product.store_id,
        productId: product.id,
      })
      toast.success("Added to cart")
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
        <Link href={productHref} className="block">
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={mainImage?.url || "/placeholder.svg?height=300&width=300&text=Product"}
              alt={mainImage?.alt_text || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />

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
                className="h-8 w-8 bg-background/90 backdrop-blur-sm rounded-xl p-2 shadow-lg hover:bg-background transition border hover:border-primary/50 group/wishlist"
                onClick={toggleWishlist}
              >
                <Heart
                  className={`h-4 w-4 transition-colors backdrop-blur-sm ${
                    isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""
                  }`}
                />
              </Button>
            </motion.div>
          </div>
        </Link>

        <CardContent className="p-2 flex-1 flex flex-col">
            <div className=" flex-1">
              <Link href={productHref}>
                <h3 className="text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">{formatAmount(product.price)}</span>
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatAmount(product.compare_at_price!)}
                  </span>
                )}
              </div>
            </div>
        </CardContent>

        <CardFooter className="p-2 pt-0">
          {shouldOpenProductPage ? (
            <Button asChild className="h-10 w-full rounded-xl text-sm font-semibold `">
              <Link href={productHref}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {needsCustomization ? "Customize" : "Select options"}
              </Link>
            </Button>
          ) : (
            <Button
              className="h-10 w-full rounded-xl text-sm font-semibold"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="mr-2 h-4 w-4" />
              )}
              Add to cart
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
