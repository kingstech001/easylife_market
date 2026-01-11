"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Search, SlidersHorizontal, Grid3x3, LayoutGrid, TrendingUp, Award, ShieldCheck, Star, Package, Heart, ShoppingCart } from "lucide-react"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import { toast } from "sonner"

// Define Product type (matches API response)
type Product = {
  _id: string
  name: string
  price: number
  primaryImage?: string
  images?: { id: string; url: string; alt_text?: string | null }[]
  storeId?: string | {
    _id: string
    name: string
    slug: string
  }
}

type HeroBanner = {
  id: string
  imageUrl: string
  title: string
  subtitle: string
  buttonText?: string
  buttonLink?: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Fetch products and banner in parallel
        const [productsRes, bannerRes] = await Promise.all([
          fetch("/api/allStoreProducts"),
          fetch("/api/hero-banner").catch(() => null)
        ])

        if (!productsRes.ok) {
          throw new Error("Failed to fetch products")
        }

        const productsData = await productsRes.json()
        setProducts(productsData.products || [])

        // Handle banner
        if (bannerRes && bannerRes.ok) {
          const bannerData = await bannerRes.json()
          setHeroBanner(bannerData.banner || null)
        }

        setError(null)
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(err.message || "Failed to load products")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddToCart = (product: Product) => {
    const imageUrl = product.images?.[0]?.url || product.primaryImage || "/placeholder.png"
    
    // Handle both string and object storeId
    const storeId = typeof product.storeId === 'string' 
      ? product.storeId 
      : product.storeId?._id

    if (!storeId) {
      console.error("Missing store information:", {
        productId: product._id,
        storeId: product.storeId,
        productName: product.name
      })
      toast.error("Cannot add to cart: Store information missing")
      return
    }

    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: imageUrl,
      storeId: storeId,
      productId: product._id,
      quantity: 1
    }
    
    addToCart(cartItem)
  }

  const handleToggleWishlist = (product: Product) => {
    const imageUrl = product.images?.[0]?.url || product.primaryImage || "/placeholder.png"
    
    // Get store slug - handle both string and object storeId
    const storeSlug = typeof product.storeId === 'object' && product.storeId?.slug
      ? product.storeId.slug
      : ""
    
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id)
      toast.success(`${product.name} removed from wishlist`)
    } else {
      addToWishlist({
        id: product._id,
        name: product.name,
        price: product.price,
        image: imageUrl,
        storeSlug: storeSlug
      })
      toast.success(`${product.name} added to wishlist`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Loading products...</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we fetch the latest products
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <Package className="h-16 w-16 text-destructive mx-auto" />
          <h3 className="text-xl font-semibold">Error Loading Products</h3>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section with Dynamic Banner */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden">
        {heroBanner?.imageUrl ? (
          <>
            {/* Background Image */}
            <Image
              src={heroBanner.imageUrl}
              alt={heroBanner.title || "Hero Banner"}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
            
            {/* Content */}
            <div className="relative container mx-auto px-4 h-full flex items-center">
              <div className="max-w-3xl text-white">
                <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-3 tracking-tight drop-shadow-lg">
                  {heroBanner.title || "Discover Quality Products"}
                </h1>
                <p className="text-lg md:text-xl mb-6 text-white/90 drop-shadow-md">
                  {heroBanner.subtitle || "Browse our curated collection from trusted sellers"}
                </p>
              </div>
            </div>
          </>
        ) : (
          // Fallback gradient design
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-primary/5">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary rounded-full blur-3xl" />
              </div>
            </div>
            
            <div className="relative container mx-auto px-4 h-full flex items-center">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">
                  Discover Quality Products
                </h1>
                <p className="text-lg text-muted-foreground">
                  Browse our curated collection from trusted sellers
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Trust Badges */}
      <div className="border-b bg-background/50 backdrop-blur-sm">
        <div className="container px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-2">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-green-900 dark:text-green-100">Secure Shopping</p>
                <p className="text-xs text-green-700 dark:text-green-300">100% Protected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-2">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">Best Prices</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Competitive Rates</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-2">
                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-purple-900 dark:text-purple-100">Quality Assured</p>
                <p className="text-xs text-purple-700 dark:text-purple-300">Verified Sellers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 lg:px-8" id="products">
        <div className="flex gap-6">
          {/* Sidebar - Filters & Ads */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-8 space-y-6">
              {/* Filters */}
              <div className="border-2 rounded-2xl shadow-sm p-6 bg-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg">Filters</h3>
                  <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Price Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full px-3 py-2 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3">
                      Categories
                    </label>
                    <div className="space-y-2">
                      {['Electronics', 'Fashion', 'Home & Garden', 'Sports'].map((cat) => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                          <input type="checkbox" className="rounded border-2 text-primary focus:ring-primary" />
                          <span className="text-sm">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-semibold shadow-lg transition">
                  Apply Filters
                </button>
              </div>

              {/* Ad Space 1 */}
              <div className="border-0 shadow-sm rounded-2xl p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
                <div className="text-xs font-bold mb-1 text-orange-700 dark:text-orange-300 uppercase tracking-wide">SPECIAL OFFER</div>
                <h3 className="text-xl font-bold mb-2 text-orange-900 dark:text-orange-100">Up to 50% Off</h3>
                <p className="text-sm mb-4 text-orange-700 dark:text-orange-300">Selected items this week only</p>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition shadow-lg">
                  Shop Now
                </button>
              </div>

              {/* Ad Space 2 */}
              <div className="border-0 shadow-sm rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
                <div className="text-xs font-bold mb-1 text-purple-700 dark:text-purple-300 uppercase tracking-wide">NEW ARRIVAL</div>
                <h3 className="text-xl font-bold mb-2 text-purple-900 dark:text-purple-100">Latest Collection</h3>
                <p className="text-sm mb-4 text-purple-700 dark:text-purple-300">Discover trending products</p>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition shadow-lg">
                  Explore
                </button>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1 min-w-0">
            {/* Top Bar */}
            <div className="border-2 shadow-sm rounded-2xl p-4 mb-6 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{products.length}</span> Products Found
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <select className="px-4 py-2 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background">
                    <option>Sort by: Featured</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Newest First</option>
                  </select>
                  
                  <div className="hidden md:flex gap-1 border-2 rounded-xl p-1">
                    <button className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Grid3x3 className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted">
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Ad Space */}
            <div className="border-0 shadow-lg rounded-2xl p-6 md:p-8 mb-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold mb-2 text-blue-700 dark:text-blue-300 uppercase tracking-wide">LIMITED TIME OFFER</div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-blue-900 dark:text-blue-100">Flash Sale - Today Only!</h2>
                  <p className="text-blue-700 dark:text-blue-300 mb-4">Get amazing deals on premium products</p>
                  <button className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg">
                    Shop Flash Sale
                  </button>
                </div>
                <div className="hidden md:block text-5xl">⚡</div>
              </div>
            </div>

            {/* Products */}
            {products.length === 0 ? (
              <div className="border-2 border-dashed rounded-2xl shadow-sm p-12 text-center bg-card">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Package className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adding some products to your stores or check back later</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                  {products.map((product) => {
                    const imageUrl = 
                      product.images?.[0]?.url || 
                      product.primaryImage || 
                      "/placeholder.png"

                    // Construct the product detail URL
                    const productUrl = typeof product.storeId === 'object' && product.storeId?.slug
                      ? `/stores/${product.storeId.slug}/products/${product._id}`
                      : `/products/${product._id}`

                    const inWishlist = isInWishlist(product._id)

                    return (
                      <div
                        key={product._id}
                        className="group border-2 shadow-sm rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all duration-300 bg-card"
                      >
                        {/* Product Image */}
                        <Link href={productUrl} className="block relative w-full h-64 bg-muted overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={product.images?.[0]?.alt_text || product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          
                          {/* Wishlist Button */}
                          <div className="absolute top-3 right-3">
                            <button 
                              onClick={(e) => {
                                e.preventDefault()
                                handleToggleWishlist(product)
                              }}
                              className={`bg-background/90 backdrop-blur-sm rounded-xl p-2 shadow-lg hover:bg-background transition border hover:border-primary/50 group/wishlist ${
                                inWishlist ? 'border-red-500' : ''
                              }`}
                            >
                              <Heart className={`h-5 w-5 transition-colors ${
                                inWishlist 
                                  ? 'text-red-500 fill-red-500' 
                                  : 'text-foreground group-hover/wishlist:text-red-500'
                              }`} />
                            </button>
                          </div>
                        </Link>

                        {/* Product Details */}
                        <div className="p-2 sm:p-5">
                          {/* Store Name */}
                          {typeof product.storeId === 'object' && product.storeId?.name && (
                            <Link 
                              href={`/stores/${product.storeId.slug}`}
                              className="text-xs sm:text-xs font-semibold text-primary mb-2 uppercase tracking-wide hover:underline inline-block"
                            >
                              {product.storeId.name}
                            </Link>
                          )}

                          {/* Product Name */}
                          <Link href={productUrl}>
                            <h2 className="font-bold text-xs sm:text-lg  line-clamp-2 group-hover:text-primary transition cursor-pointer">
                              {product.name}
                            </h2>
                          </Link>

                          {/* Rating */}
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-yellow-400" />
                            ))}
                            <span className="text-sm text-muted-foreground ml-1">(24)</span>
                          </div>

                          {/* Price and Actions */}
                          <div className="space-y-3">
                            <p className="text-lg sm:text-2xl font-bold text-primary">
                              ₦{product.price.toLocaleString()}
                            </p>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button 
                                onClick={() => handleAddToCart(product)}
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-lg flex items-center justify-center gap-2 group/cart"
                              >
                                <ShoppingCart className="h-4 w-4 group-hover/cart:scale-110 transition-transform" />
                                Add to Cart
                              </button>
                              
                              <Link 
                                href={productUrl}
                                className="bg-background hover:bg-muted border-2 border-primary/50 hover:border-primary text-foreground px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shadow-lg flex items-center justify-center"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Bottom Ad Space */}
                <div className="mt-8 border-0 shadow-lg rounded-2xl p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 text-center">
                  <h3 className="text-2xl font-bold mb-2 text-green-900 dark:text-green-100">Join Our Newsletter</h3>
                  <p className="mb-4 text-green-700 dark:text-green-300">Get exclusive deals and updates delivered to your inbox</p>
                  <div className="max-w-md mx-auto flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 pl-2 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                    <button className="bg-primary text-primary-foreground px-2 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg">
                      Subscribe
                    </button>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}