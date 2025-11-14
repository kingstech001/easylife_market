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
import { connectToDB } from "@/lib/db"
import Store from "@/models/Store"
import Product from "@/models/Product"

// ✅ Allow dynamic params
export const dynamicParams = true

// ✅ Types
interface StoreData {
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

interface ProductData {
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

// ✅ Generate static paths - DIRECT DATABASE ACCESS (NO HTTP)
export async function generateStaticParams() {
  // Skip during development
  if (process.env.NODE_ENV === 'development') {
    console.log("⚠️ [Dev] Skipping generateStaticParams in development")
    return []
  }

  try {
    console.log("🔍 [Build] Fetching stores directly from database")
    
    await connectToDB()
    
    const stores = await Store.find({ isPublished: true })
      .select('slug')
      .lean()
    
    console.log("🏪 [Build] Stores found:", stores.length)

    const params = stores.map((store: any) => ({
      slug: store.slug,
    }))
    
    console.log("✅ [Build] Generated params:", params.length)
    return params
  } catch (error) {
    console.error("💥 [Build] Error generating static params:", error)
    // Return empty array to allow dynamic rendering as fallback
    return []
  }
}

// ✅ Fetch store data - DIRECT DATABASE ACCESS
async function getStore(slug: string): Promise<StoreData | null> {
  try {
    console.log("🔍 Fetching store from database:", slug)
    
    await connectToDB()

    const store = await Store.findOne({
      slug: slug,
      isPublished: true,
    }).lean() as any

    if (!store) {
      console.log("❌ Store not found:", slug)
      return null
    }

    console.log("✅ Store fetched successfully:", store.name)

    // Transform store data
    return {
      id: store._id?.toString() || "",
      name: store.name || "Unnamed Store",
      slug: store.slug || slug,
      description: store.description || "",
      logo_url: store.logo_url || "",
      banner_url: store.banner_url || "",
      owner_id: store.sellerId?.toString() || "",
      created_at: store.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: store.updatedAt?.toISOString() || new Date().toISOString(),
    }
  } catch (error) {
    console.error("❌ Error fetching store:", error)
    return null
  }
}

// ✅ Fetch products - DIRECT DATABASE ACCESS with flexible querying
async function getStoreProducts(storeId: string, storeSlug: string): Promise<ProductData[]> {
  try {
    console.log("🔍 Fetching products from database for store:", storeId)
    
    await connectToDB()

    // Find store first to get the correct reference
    const store = await Store.findOne({ slug: storeSlug }).lean() as any
    
    if (!store) {
      console.log("⚠️ Store not found for products lookup:", storeSlug)
      return []
    }

    // Try multiple query variations to find products
    let products: any[] = []
    
    // Try 1: With isPublished filter
    products = await Product.find({
      storeId: store._id,
      isPublished: true,
    })
    .populate('images')
    .lean() as any[]

    console.log("🔍 Try 1 (with isPublished): Found", products.length, "products")

    // Try 2: Without isPublished filter if nothing found
    if (!products || products.length === 0) {
      console.log("🔍 Try 2: Fetching without isPublished filter...")
      products = await Product.find({
        storeId: store._id,
      })
      .populate('images')
      .lean() as any[]
      
      console.log("🔍 Try 2 (without isPublished): Found", products.length, "products")
    }

    // Try 3: Check with string comparison if ObjectId comparison failed
    if (!products || products.length === 0) {
      console.log("🔍 Try 3: Fetching with string storeId comparison...")
      products = await Product.find({
        storeId: store._id.toString(),
      })
      .populate('images')
      .lean() as any[]
      
      console.log("🔍 Try 3 (string comparison): Found", products.length, "products")
    }

    if (!products || products.length === 0) {
      console.log("⚠️ No products found for store after all attempts:", storeSlug)
      return []
    }

    console.log("✅ Products fetched successfully:", products.length)

    // Transform product data
    return products.map((product: any) => ({
      id: product._id?.toString() || "",
      name: product.name || "Unnamed Product",
      description: product.description || null,
      price: product.price || 0,
      compare_at_price: product.compareAtPrice || null,
      category_id: product.categoryId?.toString() || undefined,
      inventory_quantity: product.inventoryQuantity || 0,
      images: (product.images || []).map((img: any) => ({
        id: img._id?.toString() || "",
        url: img.url || "",
        alt_text: img.altText || null,
      })),
      store_id: product.storeId?.toString() || "",
      created_at: product.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: product.updatedAt?.toISOString() || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("❌ Error fetching products:", error)
    return []
  }
}

// ✅ Generate metadata with error handling
export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const store = await getStore(slug)

    if (!store) {
      return { 
        title: "Store Not Found | EasyLife Market",
        description: "The store you're looking for could not be found.",
      }
    }

    return {
      title: `${store.name} | EasyLife Market`,
      description: store.description || `Shop at ${store.name} on EasyLife Market`,
      openGraph: {
        title: store.name,
        description: store.description || `Shop at ${store.name}`,
        images: store.banner_url ? [store.banner_url] : [],
      },
    }
  } catch (error) {
    console.error("❌ Error generating metadata:", error)
    return {
      title: "Store | EasyLife Market",
      description: "Shop on EasyLife Market",
    }
  }
}

// ✅ Main page component
export default async function StorePage({ params }: StorePageProps) {
  try {
    const { slug } = await params

    console.log("🎯 Rendering store page for slug:", slug)

    // Fetch store data directly from database
    const store = await getStore(slug)
    
    // If store not found, show 404 page
    if (!store) {
      console.log("❌ Store not found, showing 404")
      notFound()
    }

    // Fetch products directly from database
    const storeProducts = await getStoreProducts(store.id, slug)

    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Visit Tracker */}
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
              <AvatarPlaceholder 
                name={store.name} 
                className="h-24 w-24 sm:h-32 sm:w-32 text-4xl" 
              />
            </div>
          )}
        </div>

        {/* Store Info */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-start gap-4 md:gap-6">
            <div className="flex gap-4 w-full">
              {/* Store Logo */}
              <div className="relative flex-shrink-0">
                {store.logo_url ? (
                  <Image
                    src={store.logo_url}
                    alt={`${store.name} logo`}
                    width={96}
                    height={96}
                    className="w-16 h-16 md:w-28 md:h-28 rounded-full object-cover border-4 border-background shadow-xl"
                  />
                ) : (
                  <AvatarPlaceholder
                    name={store.name}
                    className="h-16 w-16 md:h-28 md:w-28 text-xl md:text-2xl border-4 border-background rounded-full shadow-lg"
                  />
                )}
              </div>

              {/* Store Details */}
              <div className="flex-1 min-w-0">
                <div className="mb-2 space-y-2">
                  <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
                    {store.name}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
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

            {/* Store Description */}
            {store.description && (
              <div className="w-full">
                <ExpandableText
                  text={store.description || "Welcome to our store! Discover amazing products and great deals."}
                  limit={150}
                />
              </div>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-12">
          <div className="container mx-auto max-w-screen-xl">
            <h2 className="text-xl font-semibold mb-6">Products</h2>

            {storeProducts.length > 0 ? (
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {storeProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    storeSlug={store.slug} 
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8">
                <CardContent className="text-center py-8">
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
  } catch (error) {
    console.error("❌ Critical error in StorePage:", error)
    notFound()
  }
}