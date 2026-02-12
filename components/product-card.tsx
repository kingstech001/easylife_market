"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
}

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { formatAmount } = useFormatAmount()

  const mainImage = product.images?.[0]
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPercentage = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0

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

  // Enhanced debugging
  useEffect(() => {
    if (product.hasVariants) {
      console.log('=== PRODUCT DEBUG ===')
      console.log('Product Name:', product.name)
      console.log('Has Variants Flag:', product.hasVariants)
      console.log('Raw Variants:', product.variants)
      console.log('Variants Type:', typeof product.variants)
      console.log('Is Array:', Array.isArray(product.variants))
      console.log('Parsed Variants:', parsedVariants)
      console.log('Parsed Variants Length:', parsedVariants?.length)
      
      if (parsedVariants && parsedVariants.length > 0) {
        console.log('First Variant:', parsedVariants[0])
        console.log('First Variant Color:', parsedVariants[0]?.color)
        console.log('First Variant Sizes:', parsedVariants[0]?.sizes)
      }
      console.log('===================')
    }
  }, [product.hasVariants, product.variants, product.name])

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
      <Link href={`/stores/${storeSlug}/products/${product.id}`} className="block h-full">
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm h-full flex flex-col">
          <div className="relative aspect-square overflow-hidden">
            <Image
              src={mainImage?.url || "/placeholder.svg?height=300&width=300&text=Product"}
              alt={mainImage?.alt_text || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />

           

            {product.inventory_quantity <= 5 && product.inventory_quantity > 0 && !product.hasVariants && (
              <Badge variant="secondary" className="absolute top-2 right-2 bg-amber-100 text-amber-800">
                Low Stock
              </Badge>
            )}

            {product.inventory_quantity === 0 && !product.hasVariants && (
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

          <CardContent className="p-2 flex-1 flex flex-col">
            <div className=" flex-1">
              <h3 className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">{formatAmount(product.price)}</span>
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatAmount(product.compare_at_price!)}
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
        </Card>
      </Link>
    </motion.div>
  )
}