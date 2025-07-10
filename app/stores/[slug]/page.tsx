import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { mockStores, mockProducts, mockCategories } from "@/lib/mock-data"
import { ProductCard } from "@/components/product-card"
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StorePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = params
  const store = mockStores.find((store) => store.slug === slug)

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
  const store = mockStores.find((store) => store.slug === params.slug)

  if (!store) {
    notFound()
    return null
  }

  const storeCategories = mockCategories.filter((category) => category.store_id === store.id)
  const storeProducts = mockProducts.filter((product) => product.store_id === store.id)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Store Banner */}
      <div className="relative h-48 sm:h-56 md:h-64 w-full">
        {store.banner_url ? (
          <Image
            src={store.banner_url}
            alt={`${store.name} banner`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="h-full w-full bg-muted flex items-center justify-center">
            <AvatarPlaceholder name={store.name} className="h-24 w-24 sm:h-32 sm:w-32 text-4xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Store Info */}
      <div className="container px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 -mt-16 md:-mt-20 z-10 relative">
          <div className="relative">
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt={`${store.name} logo`}
                width={96}
                height={96}
                className="rounded-full border-4 border-background"
              />
            ) : (
              <AvatarPlaceholder
                name={store.name}
                className="h-24 w-24 text-2xl border-4 border-background rounded-full"
              />
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{store.name}</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
              {store.description || "No description available"}
            </p>
          </div>
        </div>
      </div>

      {/* Store Products */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-screen-xl mx-auto">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="gap-2 mb-6 flex-wrap sm:flex-nowrap">
              <TabsTrigger
                value="all"
                className="flex-shrink-0 text-xs px-3 py-1 sm:text-sm sm:px-4 sm:py-2"
              >
                All Products
              </TabsTrigger>
              {storeCategories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex-shrink-0 text-xs px-3 py-1 sm:text-sm sm:px-4 sm:py-2"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* All Products Tab */}
            <TabsContent value="all">
              {storeProducts.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {storeProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      storeSlug={store.slug}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No products found.</p>
              )}
            </TabsContent>

            {/* Category Tabs */}
            {storeCategories.map((category) => {
              const filteredProducts = storeProducts.filter(
                (product) => product.category_id === category.id
              )
              return (
                <TabsContent key={category.id} value={category.id}>
                  {filteredProducts.length > 0 ? (
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          storeSlug={store.slug}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      No products in this category.
                    </p>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
