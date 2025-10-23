"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, XCircle, Store } from "lucide-react"
import Image from "next/image"

interface Product {
  _id: string
  name: string
  description: string
  price: number
  inventoryQuantity: number
  images: { url: string }[]
  isActive: boolean
  storeId: string
  isDeleted: boolean
}

export default function StoreProductsPage() {
  const { storeId } = useParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/dashboard/admin/stores/${storeId}/products`)
        const data = await res.json()

        if (!res.ok) throw new Error(data.message || "Failed to load products")

        const activeProducts = data.filter((p: Product) => p.isActive && !p.isDeleted)

        setProducts(activeProducts)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (storeId) fetchProducts()
  }, [storeId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-muted rounded-xl"></div>
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded w-64"></div>
                <div className="h-4 bg-muted rounded w-48"></div>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-sm backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-40 bg-muted rounded-lg animate-pulse"></div>
                      <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Error Loading Products</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-900/20 flex items-center justify-center mx-auto">
            <Package className="h-6 w-6 text-slate-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">No Products Found</h2>
          <p className="text-muted-foreground">This store doesn't have any active products yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-900/20 flex items-center justify-center">
                <Store className="h-8 w-8 text-slate-600" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Store Products
                </h1>
                <p className="text-sm md:text-lg text-slate-600 dark:text-slate-400">
                  Browse all active products in this store
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1">
                <Package className="h-3 w-3 mr-1" />
                {products.length} {products.length === 1 ? "Product" : "Products"}
              </Badge>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => {
              const imageUrl =
                product.images && product.images.length > 0
                  ? product.images[0].url || "/placeholder.svg?height=160&width=320"
                  : "/placeholder.svg?height=160&width=320"

              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.05 * index }}
                >
                  <Card className="border-1 border transition-all duration-300 hover:shadow-lg group cursor-pointer h-full">
                    <CardHeader className="p-0">
                      <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                        <Image
                          src={imageUrl || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-1">
                        {product.name}
                      </CardTitle>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div>
                          <p className="text-xl font-bold text-green-600">₦{product.price.toLocaleString()}</p>
                          <p className="text-xs text-slate-500 mt-1">Stock: {product.inventoryQuantity}</p>
                        </div>
                        {product.inventoryQuantity > 0 ? (
                          <Badge
                            variant="secondary"
                            className="bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                          >
                            In Stock
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                          >
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
