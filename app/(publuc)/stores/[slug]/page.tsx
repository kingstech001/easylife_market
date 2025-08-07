import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ProductCard } from "@/components/product-card"
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Star } from "lucide-react"

// Types for the API responses
interface Store {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  owner_id: string
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
  store_id: string
  created_at: string
  updated_at: string
}

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

interface StorePageProps {
  params: Promise<{
    slug: string
  }>
}

// Fetch store data from API
async function getStore(slug: string): Promise<Store | null> {
  try {
    console.log("Fetching store with slug:", slug)

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/stores/${slug}`
    console.log("API URL:", apiUrl)

    const response = await fetch(apiUrl, {
      cache: "no-store",
    })

    console.log("Response status:", response.status)

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Store not found (404)")
        return null
      }
      throw new Error(`Failed to fetch store: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Store API response:", data)

    if (!data.success) {
      console.log("API returned error:", data.message)
      return null
    }

    console.log("Store data received:", data.store?.name)
    return data.store
  } catch (error) {
    console.error("Error fetching store:", error)
    return null
  }
}

// Fetch store products from API using slug
async function getStoreProducts(slug: string): Promise<Product[]> {
  try {
    console.log("Fetching products for store slug:", slug)

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/stores/${slug}/products`
    console.log("Products API URL:", apiUrl)

    const response = await fetch(apiUrl, {
      cache: "no-store",
    })

    console.log("Products API Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("Products API Error response:", errorText)
      throw new Error(`Failed to fetch products: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Products API response:", data)

    if (!data.success) {
      console.log("Products API returned error:", data.message)
      return []
    }

    console.log("Products received:", data.products?.length || 0)
    return data.products || []
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

// Fetch store categories from API using slug
async function getStoreCategories(slug: string): Promise<Category[]> {
  try {
    console.log("Fetching categories for store slug:", slug)

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/stores/${slug}/categories`
    console.log("Categories API URL:", apiUrl)

    const response = await fetch(apiUrl, {
      cache: "no-store",
    })

    console.log("Categories API Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.log("Categories API Error response:", errorText)
      throw new Error(`Failed to fetch categories: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Categories API response:", data)

    if (!data.success) {
      console.log("Categories API returned error:", data.message)
      return []
    }

    console.log("Categories received:", data.categories?.length || 0)
    return data.categories || []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params
  const store = await getStore(slug)

  if (!store) {
    return {
      title: "Store Not Found",
    }
  }

  return {
    title: `${store.name} | ShopBuilder`,
    description: store.description || `Shop at ${store.name}`,
  }
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params

  console.log("Store page loading for slug:", slug)

  // Fetch store data
  const store = await getStore(slug)

  if (!store) {
    console.log("Store not found, showing 404")
    notFound()
  }

  console.log("Store found:", store.name)

  // Fetch store products and categories in parallel using slug
  const [storeProducts, storeCategories] = await Promise.all([getStoreProducts(slug), getStoreCategories(slug)])

  console.log("Store data:", { store: store.name, products: storeProducts.length, categories: storeCategories.length })

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Store Banner */}
      <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden">
        {store.banner_url ? (
          <Image
            src={store.banner_url || "/placeholder.svg"}
            alt={`${store.name} banner`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <AvatarPlaceholder name={store.name} className="h-24 w-24 sm:h-32 sm:w-32 text-4xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      {/* Store Info */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-start gap-4 md:gap-6  z-10 relative">
          <div className="flex  gap-4">
            <div className="relative flex-shrink-0">
              {store.logo_url ? (
                <Image
                  src={store.logo_url || "/placeholder.svg"}
                  alt={`${store.name} logo`}
                  width={96}
                  height={96}
                  className="w-16 h-16 md:w-28 md:h-28 rounded-3xl object-cover border-4 shadow-xl"
                />
              ) : (
                <AvatarPlaceholder
                  name={store.name}
                  className="h-24 w-24 text-2xl border-4 border-background rounded-full shadow-lg"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className=" gap-2 sm:gap-4 mb-2 space-y-2">
                <h1 className="text-2xl sm:text-4xl font-bold text-foreground">{store.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    4.5
                  </Badge>
                  <Badge variant="outline">Open</Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Local Store</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Open 9AM - 9PM</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground mb-4 max-w-3xl text-sm sm:text-base">
              {store.description || "Welcome to our store! Discover amazing products and great deals."}
            </p>
        </div>
      </div>

      {/* Store Products */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="container mx-auto max-w-screen-xl">
          {storeCategories.length > 0 ? (
            <Tabs defaultValue="all" className="w-full">
              <div className="mb-6">
                <TabsList className="grid w-full grid-cols-2 sm:flex sm:w-auto gap-2 h-auto p-1 bg-muted/50">
                  <TabsTrigger
                    value="all"
                    className="flex-shrink-0 text-xs px-3 py-2 sm:text-sm sm:px-4 data-[state=active]:bg-background"
                  >
                    All Products ({storeProducts.length})
                  </TabsTrigger>
                  {storeCategories.map((category) => {
                    const categoryProductCount = storeProducts.filter((p) => p.category_id === category.id).length
                    return (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className="flex-shrink-0 text-xs px-3 py-2 sm:text-sm sm:px-4 data-[state=active]:bg-background"
                      >
                        {category.name} ({categoryProductCount})
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>

              {/* All Products Tab */}
              <TabsContent value="all" className="mt-0">
                {storeProducts.length > 0 ? (
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {storeProducts.map((product) => (
                      <ProductCard key={product.id} product={product} storeSlug={store.slug} />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8">
                    <CardContent className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
                      <p className="text-muted-foreground">
                        This store hasn't added any products yet. Check back later!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Category Tabs */}
              {storeCategories.map((category) => {
                const filteredProducts = storeProducts.filter((product) => product.category_id === category.id)
                return (
                  <TabsContent key={category.id} value={category.id} className="mt-0">
                    {filteredProducts.length > 0 ? (
                      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredProducts.map((product) => (
                          <ProductCard key={product.id} product={product} storeSlug={store.slug} />
                        ))}
                      </div>
                    ) : (
                      <Card className="p-8">
                        <CardContent className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-2xl">🏷️</span>
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No Products in {category.name}</h3>
                          <p className="text-muted-foreground">This category doesn't have any products yet.</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                )
              })}
            </Tabs>
          ) : (
            // No categories, show all products directly
            <div>
              <h2 className="text-xl font-semibold mb-6">Products</h2>
              {storeProducts.length > 0 ? (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {storeProducts.map((product) => (
                    <ProductCard key={product.id} product={product} storeSlug={store.slug} />
                  ))}
                </div>
              ) : (
                <Card className="p-8">
                  <CardContent className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-2xl">🏪</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Store Coming Soon</h3>
                    <p className="text-muted-foreground">
                      {store.name} is setting up their store. Products will be available soon!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
