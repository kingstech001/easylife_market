'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  Heart,
  ShoppingCart,
  Share2,
  Star,
  ChevronLeft,
  Check,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { mockProducts, mockStores } from "@/lib/mock-data"
import { formatPrice } from "@/lib/utils"
import { use } from "react"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"

export default function ProductPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string; productId: string }>
}) {
  const params = use(paramsPromise)
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const product = mockProducts.find((p) => p.id === params.productId)
  const store = mockStores.find((s) => s.slug === params.slug)

  if (!product || !store) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const handleAddToCart = () => {
    setIsAddingToCart(true)

    setTimeout(() => {
      setIsAddingToCart(false)
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images[0]?.url || "/placeholder.svg",
      })
    }, 1000)
  }

  const toggleWishlist = () => {
    const wishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || "/placeholder.svg",
      storeSlug: store.slug,
    }

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(wishlistItem)
    }
  }

  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1))

  return (
    <div className="container py-10 max-w-[1280px] mx-auto px-6 sm:px-8">
      <AnimatedContainer animation="fadeIn" className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to {store.name}
        </Button>
      </AnimatedContainer>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <AnimatedContainer animation="slideIn" className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-background">
            <Image
              src={
                product.images[selectedImage]?.url ||
                "/placeholder.svg?height=600&width=600"
              }
              alt={product.images[selectedImage]?.alt_text || product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-auto pb-2">
              {product.images.map((image, index) => (
                <motion.div
                  key={image.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative aspect-square w-20 cursor-pointer overflow-hidden rounded-md border ${selectedImage === index ? "ring-2 ring-primary" : ""
                    }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <Image
                    src={image.url || "/placeholder.svg"}
                    alt={image.alt_text || `Product image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatedContainer>

        <AnimatedContainer animation="slideUp" className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={toggleWishlist}>
                  <Heart
                    className={`h-5 w-5 transition-colors duration-300 ${
                      isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < 4 ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                      }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(24 reviews)</span>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
                {product.compare_at_price && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.compare_at_price)}
                    </span>
                    <Badge className="bg-red-500 hover:bg-red-600">
                      {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-sm">
                In stock - {product.inventory_quantity} available
              </span>
            </div>

            <div className="flex custom-xsm:flex-col sm:flex-row items-center gap-4 w-full">
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-r-none h-10 w-10"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <div className="w-12 text-center">{quantity}</div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-l-none h-10 w-10"
                  onClick={incrementQuantity}
                >
                  +
                </Button>
              </div>
              <Button
                className="flex-1 py-4 w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? "Adding..." : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <Tabs defaultValue="description">
            <TabsList className="w-full">
              <TabsTrigger value="description" className="flex-1">
                Description
              </TabsTrigger>
              <TabsTrigger value="details" className="flex-1">
                Details
              </TabsTrigger>
              <TabsTrigger value="shipping" className="flex-1">
                Shipping
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="pt-4">
              <p className="text-muted-foreground">
                {product.description || "No description available for this product."}
              </p>
            </TabsContent>
            <TabsContent value="details" className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">SKU</span>
                  <span className="text-muted-foreground">SKU-{product.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Category</span>
                  <span className="text-muted-foreground">
                    {product.category_id ? "Category " + product.category_id : "Uncategorized"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Store</span>
                  <span className="text-muted-foreground">{store.name}</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="shipping" className="pt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Free Shipping</p>
                    <p className="text-sm text-muted-foreground">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Delivery Time</p>
                    <p className="text-sm text-muted-foreground">3-5 business days</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </AnimatedContainer>
      </div>

      <AnimatedContainer animation="fadeIn" delay={0.3} className="mt-16">
        <h2 className="text-2xl font-bold mb-6">You might also like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mockProducts
            .filter((p) => p.id !== product.id && p.store_id === product.store_id)
            .slice(0, 4)
            .map((relatedProduct) => (
              <Card
                key={relatedProduct.id}
                className="overflow-hidden h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  router.push(`/stores/${params.slug}/products/${relatedProduct.id}`)
                }
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={relatedProduct.images[0]?.url || "/placeholder.svg"}
                    alt={relatedProduct.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{relatedProduct.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {formatPrice(relatedProduct.price)}
                  </p>
                </div>
              </Card>
            ))}
        </div>
      </AnimatedContainer>
    </div>
  )
}
