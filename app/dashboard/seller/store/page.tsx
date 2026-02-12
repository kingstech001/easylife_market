"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Store, Edit, Loader2, AlertCircle, MapPin, Calendar, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import ExpandableText from "@/components/ExpandableText"

interface StoreData {
  _id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  createdAt?: string
}

export default function StoreViewPage() {
  const router = useRouter()
  const [store, setStore] = useState<StoreData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch store data
  useEffect(() => {
    fetchStore()
  }, [])

  const fetchStore = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/dashboard/seller/store")
      
      if (!response.ok) {
        throw new Error("Failed to fetch store")
      }

      const data = await response.json()
      setStore(data.store)
    } catch (error) {
      console.error("Error fetching store:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditStore = () => {
    router.push(`/dashboard/seller/store/${store?._id}/edit`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading your store...</span>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Store not found. Please contact support.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-8 sm:px-6">
        {/* Header with Edit Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:flex items-center justify-between"
        >
          <div className="flex gap-4 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Store</h1>
              <p className="text-muted-foreground">View and manage your store</p>
            </div>
          </div>
          <Button onClick={handleEditStore} size="lg" className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            Edit Store
          </Button>
        </motion.div>

        <div className="space-y-6">
          {/* Banner & Logo Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden">
              {/* Banner */}
              <div className="relative w-full h-64 bg-gradient-to-r from-primary/20 to-primary/10">
                {store.banner_url ? (
                  <img
                    src={store.banner_url}
                    alt="Store banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Store className="h-16 w-16 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No banner set</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Logo Overlay */}
              <div className="relative px-6 pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl bg-muted">
                      {store.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt="Store logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Store className="h-12 w-12 opacity-50" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{store.name}</h2>
                    <div className="flex items-center gap-4 text-[10px] md:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>/{store.slug}</span>
                      </div>
                      {store.createdAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Joined {new Date(store.createdAt).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Store Description with Expandable Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>About This Store</CardTitle>
              </CardHeader>
              <CardContent>
                {store.description ? (
                  <div className="leading-relaxed">
                    <ExpandableText text={store.description} limit={200} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No description added yet</p>
                    <Button onClick={handleEditStore} variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Add Description
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Store Details Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Store URL */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Store URL</CardTitle>
                <CardDescription>Your public store link</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 text-[13px] md:text-sm">
                    /stores/{store.slug}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`/stores/${store.slug}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Store ID */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Store ID</CardTitle>
                <CardDescription>Your unique store identifier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted rounded-lg">
                  <code className="text-sm break-all">{store._id}</code>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Customize Your Store</h3>
                    <p className="text-sm text-muted-foreground">
                      Add your logo, banner, and description to make your store stand out
                    </p>
                  </div>
                  <Button onClick={handleEditStore} size="lg" className="shrink-0 w-full sm:w-auto">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Store Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}