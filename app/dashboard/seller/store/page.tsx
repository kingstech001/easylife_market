"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Pencil, Plus, StoreIcon, Calendar, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StoreType {
  _id: string
  name: string
  description?: string
  isPublished: boolean
  createdAt: string
  slug: string
}

export default function SellerStorePage() {
  const [store, setStore] = useState<StoreType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch("/api/dashboard/seller/store", { cache: "no-store" })
        if (!res.ok) {
          console.error("Failed to fetch store: ", res.status)
          return
        }
        const text = await res.text()
        if (!text) return
        const data = JSON.parse(text)
        setStore(data.store || null)
      } catch (err) {
        console.error("Failed to fetch store", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStore()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container px-4 py-8 ">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                <div className="h-4 w-64 bg-muted rounded animate-pulse" />
              </div>
            </div>

            {/* Card Skeleton */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-muted rounded animate-pulse" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container  px-4 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <StoreIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                My Store
              </h1>
              <p className="text-lg text-muted-foreground mt-1">Manage your store settings and information</p>
            </div>
          </div>
        </div>

        {store ? (
          <div className="space-y-8">
            {/* Store Overview Card */}
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card border">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold text-card-foreground group-hover:text-foreground transition-colors">
                      {store.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={store.isPublished ? "default" : "secondary"}
                        className={`${
                          store.isPublished
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {store.isPublished ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Draft
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                    <p className="text-foreground leading-relaxed">
                      {store.description || "No description available."}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Created on{" "}
                      {new Date(store.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                  <Button asChild className="flex-1 sm:flex-none">
                    <Link href={`/dashboard/seller/store/${store._id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Store Details
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1 sm:flex-none bg-transparent">
                    <Link href={`/stores/${store.slug}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Store
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Store Status</p>
                    <p className="text-2xl font-bold text-foreground">{store.isPublished ? "Live" : "Draft"}</p>
                  </div>
                  <div
                    className={`p-3 rounded-xl ${
                      store.isPublished ? "bg-green-100 dark:bg-green-900/20" : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    {store.isPublished ? (
                      <Eye className="h-6 w-6 text-green-600" />
                    ) : (
                      <EyeOff className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Days Active</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.floor((Date.now() - new Date(store.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Store ID</p>
                    <p className="text-lg font-mono text-foreground truncate">{store._id?.slice(0, 8) || "N/A"}...</p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                    <StoreIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 p-4 bg-muted rounded-full">
                <StoreIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">No store found</h3>
              <p className="text-muted-foreground mb-8 max-w-md">
                You haven&apos;t created a store yet. Get started by creating your first store to begin selling your
                products.
              </p>
              <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
                <Link href="/dashboard/seller/stores/create">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Store
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
