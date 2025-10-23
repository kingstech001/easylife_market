"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, StoreIcon, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { StoreCard } from "@/components/dashboard/store-card"
import { Card, CardContent } from "@/components/ui/card"

interface AdminStore {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  isApproved: boolean
}

export default function StoresPage() {
  const [stores, setStores] = useState<AdminStore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/dashboard/admin/stores")

        if (!response.ok) {
          throw new Error("Failed to fetch stores")
        }

        const data = await response.json()
        const rawStores = Array.isArray(data) ? data : data.stores || []

        // Map API data to match StoreCard's expected props
        const formattedStores: AdminStore[] = rawStores.map((s: any) => ({
          id: s.id ?? s._id ?? "",
          name: s.name ?? "",
          slug: s.slug ?? "",
          description: s.description ?? null,
          logo_url: s.logo_url ?? null,
          banner_url: s.banner_url ?? null,
          is_published: s.is_published ?? true,
          created_at: s.created_at ?? s.createdAt ?? "",
          updated_at: s.updated_at ?? s.updatedAt ?? "",
          isApproved: s.isApproved ?? true,
        }))

        setStores(formattedStores)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [])

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
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[400px] space-y-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full"></div>
              <div className="relative bg-red-500/10 p-6 rounded-2xl">
                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Failed to Load Stores</h3>
              <p className="text-muted-foreground max-w-md">{error}</p>
            </div>
            <Button onClick={() => window.location.reload()} size="lg">
              Try Again
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <div className="relative bg-primary/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                <StoreIcon className="h-8 w-8 text-primary" />
              </div>
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Stores</h1>
              <p className="text-muted-foreground mt-1">Manage and monitor all your stores</p>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Button asChild size="lg" className="shadow-lg">
              <Link href="/dashboard/admin/stores/create">
                <Plus className="mr-2 h-5 w-5" />
                New Store
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Stores Grid */}
        {stores.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="col-span-full"
          >
            <Card className="border-dashed border-2 bg-card/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                  <div className="relative bg-primary/10 p-6 rounded-2xl">
                    <StoreIcon className="h-16 w-16 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-foreground mb-2">No stores yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  You haven't created any stores yet. Create your first store to get started with your business.
                </p>
                <Button asChild size="lg" className="shadow-lg">
                  <Link href="/admin/stores/create">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Your First Store
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {stores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
              >
                <StoreCard store={store} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
