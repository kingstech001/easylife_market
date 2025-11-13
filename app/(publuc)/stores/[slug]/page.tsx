import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ProductCard } from "@/components/product-card"
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Star } from "lucide-react"
import { VisitTracker } from "@/components/visit-tracker"
import ExpandableText from "@/components/ExpandableText"

// ✅ Types
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
  params: Promise<{ slug: string }>
}

// ✅ Generate static paths at build time
export async function generateStaticParams() {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/stores`
    
    console.log("🔍 [Build] Fetching stores from:", apiUrl)
    
    const response = await fetch(apiUrl, {
      cache: "no-store",
    })

    console.log("📡 [Build] Response status:", response.status)

    if (!response.ok) {
      console.error("❌ [Build] Failed to fetch stores:", response.status)
      return []
    }

    const data = await response.json()
    
    if (!data.success || !Array.isArray(data.stores)) {
      console.error("❌ [Build] Invalid response format:", data)
      return []
    }
    
    console.log("🏪 [Build] Stores found:", data.stores.length)

    const params = data.stores.map((store: any) => ({
      slug: store.slug,
    }))
    
    console.log("✅ [Build] Generated params:", params.length)
    return params
  } catch (error) {
    console.error("💥 [Build] Error generating static params:", error)
    return []
  }
}

// ✅ Fetch store data with error handling
async function getStore(slug: string): Promise<Store | null> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/stores/${slug}`
    
    console.log("🔍 Fetching store:", apiUrl)
    
    const response = await fetch(apiUrl, { 
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })

    console.log("📡 Store response status:", response.status)

    if (!response.ok) {
      if (response.status === 404) {
        console.log("❌ Store not found:", slug)
        return null
      }
      throw new Error(`Failed to fetch store: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success || !data.store) {
      console.error("❌ Invalid store response:", data)
      return null
    }
    
    console.log("✅ Store fetched:", data.store.name)
    return data.store
  } catch (error) {
    console.error("❌ Error fetching store:", error)
    return null
  }
}

// ✅ Fetch products with error handling
async function getStoreProducts(slug: string): Promise<Product[]> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/stores/${slug}/products`
    
    console.log("🔍 Fetching products:", apiUrl)
    
    const response = await fetch(apiUrl, { 
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })

    console.log("📡 Products response status:", response.status)

    if (!response.ok) {
      console.error("❌ Failed to fetch products:", response.status)
      return []
    }

    const data = await response.json()
    
    if (!data.success || !Array.isArray(data.products)) {
      console.error("❌ Invalid products response:", data)
      return []
    }
    
    console.log("✅ Products fetched:", data.products.length)
    return data.products
  } catch (error) {
    console.error("❌ Error fetching products:", error)
    return []
  }
}

// ✅ Generate metadata
export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params
  const store = await getStore(slug)

  if (!store) {
    return { 
      title: "Store Not Found",
      description: "The store you're looking for could not be found.",
    }
  }

  return {
    title: store.name,
    description: store.description || `Shop at ${store.name}`,
    openGraph: {
      title: store.name,
      description: store.description || `Shop at ${store.name}`,
      images: store.banner_url ? [store.banner_url] : [],
    },
  }
}

// ✅ Main page component
export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params

  console.log("🎯 Rendering store page for slug:", slug)

  const store = await getStore(slug)
  
  if (!store) {
    console.log("❌ Store not found, showing 404")
    notFound()
  }

  const storeProducts = await getStoreProducts(slug)

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <VisitTracker storeId={store.id} />

      {/* Store Banner */}
      <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden">
        {store.banner_url ? (
          <Image
            src={store.banner_url}
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
      </div>

      {/* Store Info */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-start gap-4 md:gap-6">
          <div className="flex gap-4">
            <div className="relative flex-shrink-0">
              {store.logo_url ? (
                <Image
                  src={store.logo_url}
                  alt={`${store.name} logo`}
                  width={96}
                  height={96}
                  className="w-16 h-16 md:w-28 md:h-28 rounded-full object-cover border-4 shadow-xl"
                />
              ) : (
                <AvatarPlaceholder
                  name={store.name}
                  className="h-24 w-24 text-2xl border-4 border-background rounded-full shadow-lg"
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="mb-2 space-y-2">
                <h1 className="text-2xl sm:text-4xl font-bold text-foreground">{store.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" /> 4.5
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

          <div className="mb-4">
            <ExpandableText
              text={store.description || "Welcome to our store! Discover amazing products and great deals."}
              limit={150}
            />
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="container mx-auto max-w-screen-xl">
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
      </div>
    </div>
  )
}