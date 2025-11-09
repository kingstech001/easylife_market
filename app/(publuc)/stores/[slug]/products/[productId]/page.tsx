"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Heart, ShoppingCart, Share2, Star, ChevronLeft, Check, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { use } from "react"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import { toast } from "sonner"
import { useFormatAmount } from "@/hooks/useFormatAmount"

// Types
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


interface Store {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
}

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
  const [product, setProduct] = useState<Product | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { formatAmount } = useFormatAmount();
  const [error, setError] = useState<string | null>(null)

  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  // Fetch product data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch product details
        const productResponse = await fetch(`/api/stores/${params.slug}/products/${params.productId}`)

        if (!productResponse.ok) {
          if (productResponse.status === 404) {
            setError("Product not found")
            return
          }
          throw new Error("Failed to fetch product")
        }

        const productData = await productResponse.json()
        if (!productData.success) {
          throw new Error(productData.message || "Failed to fetch product")
        }

        setProduct(productData.product)

        // Fetch store details
        const storeResponse = await fetch(`/api/stores/${params.slug}`)
        if (storeResponse.ok) {
          const storeData = await storeResponse.json()
          if (storeData.success) {
            setStore(storeData.store)
          }
        }

        // Fetch related products (other products from same store)
        const relatedResponse = await fetch(`/api/stores/${params.slug}/products`)
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json()
          if (relatedData.success) {
            // Filter out current product and limit to 4
            const filtered = relatedData.products.filter((p: Product) => p.id !== params.productId).slice(0, 4)
            setRelatedProducts(filtered)
          }
        }
      } catch (err) {
        console.error("Error fetching product data:", err)
        setError(err instanceof Error ? err.message : "Failed to load product")
        toast.error("Failed to load product", {
          description: "Please try again later",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.slug, params.productId])

  const handleAddToCart = () => {
    if (!product) return

    setIsAddingToCart(true)
    setTimeout(() => {
      setIsAddingToCart(false)
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images[0]?.url || "/placeholder.svg",
        storeId: product.store_id,
        productId: product.id,
      })
    }, 1000)
  }

  const toggleWishlist = () => {
    if (!product || !store) return

    const wishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || "/placeholder.svg",
      storeSlug: store.slug,
    }

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
      toast.success("Removed from wishlist")
    } else {
      addToWishlist(wishlistItem)
      toast.success("Added to wishlist")
    }
  }

  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1))

  // Loading state
  if (loading) {
    return (
      <div className="container py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    )
  }

  // Error state
  if (error || !product || !store) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">{error === "Product not found" ? "Product Not Found" : "Error"}</h1>
        <p className="text-muted-foreground mb-8">
          {error || "The product you're looking for doesn't exist or has been removed."}
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPercentage = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0

  return (
    <div className="container py-10 max-w-[1280px] mx-auto px-6 sm:px-8">
      <AnimatedContainer animation="fadeIn" className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to {store.name}
        </Button>
      </AnimatedContainer>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Product Images */}
        <AnimatedContainer animation="slideIn" className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-background">
            <Image
              src={product.images[selectedImage]?.url || "/placeholder.svg?height=600&width=600" || "/placeholder.svg"}
              alt={product.images[selectedImage]?.alt_text || product.name}
              fill
              className="object-cover"
              priority
            />
            {hasDiscount && (
              <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground">
                -{discountPercentage}% OFF
              </Badge>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-auto pb-2">
              {product.images.map((image, index) => (
                <motion.div
                  key={image.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative aspect-square w-20 cursor-pointer overflow-hidden rounded-md border ${
                    selectedImage === index ? "ring-2 ring-primary" : ""
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

        {/* Product Info */}
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
                    className={`h-4 w-4 ${i < 4 ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(24 reviews)</span>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{formatAmount(product.price)}</span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatAmount(product.compare_at_price!)}
                    </span>
                    <Badge className="bg-red-500 hover:bg-red-600">{discountPercentage}% OFF</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {product.inventory_quantity > 0 ? (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-sm">In stock - {product.inventory_quantity} available</span>
                </>
              ) : (
                <>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <Info className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-red-600">Out of stock</span>
                </>
              )}
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
                  disabled={quantity >= product.inventory_quantity}
                >
                  +
                </Button>
              </div>
              <Button
                className="flex-1 py-4 w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={isAddingToCart || product.inventory_quantity === 0}
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {product.inventory_quantity === 0 ? "Out of Stock" : "Add to Cart"}
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
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Stock</span>
                  <span className="text-muted-foreground">{product.inventory_quantity} units</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="shipping" className="pt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Free Shipping</p>
                    <p className="text-sm text-muted-foreground">On orders over ₦20,000</p>
                    <p className="text-sm text-muted-foreground">Within Ogrute</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Delivery Time</p>
                    <p className="text-sm text-muted-foreground">1-2 business days</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </AnimatedContainer>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <AnimatedContainer animation="fadeIn" delay={0.3} className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Card
                key={relatedProduct.id}
                className="overflow-hidden h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/stores/${params.slug}/products/${relatedProduct.id}`)}
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
                  <h3 className="font-semibold line-clamp-2">{relatedProduct.name}</h3>
                  <p className="text-muted-foreground text-sm mt-1">₦{relatedProduct.price.toFixed(2)}</p>
                </div>
              </Card>
            ))}
          </div>
        </AnimatedContainer>
      )}
    </div>
  )
}
