"use client"

import type { Metadata } from "next"
import Link from "next/link"
import { useState, useEffect } from "react"
import { StoreCard } from "@/components/store-card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Store, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/Reveal"

// Define the StoreData interface to match your IStore Mongoose model
interface StoreData {
  _id: string // MongoDB's default ID
  name: string
  slug: string // Added slug
  description?: string
  logo_url?: string
  banner_url?: string
  sellerId: string
  isPublished: boolean // Changed from is_published to isPublished
  createdAt: string
  updatedAt: string
}


export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch("/api/stores")
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: "Unknown error" }))
          throw new Error(errorData.message || `Failed to fetch stores: ${res.statusText}`)
        }
        const data = await res.json()
        setStores(data.stores)
      } catch (err: any) {
        console.error("Error fetching stores:", err)
        setError(err.message || "Failed to load stores. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchStores()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Loading stores...</h3>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-6 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
          <h3 className="text-xl font-semibold">Error Loading Stores</h3>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Reveal direction="down">
      <section className="relative w-full py-16 md:py-24 lg:py-32 overflow-hidden">
        {/* Background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-background to-muted/50" />

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/3 via-transparent to-secondary/3 rounded-full blur-3xl" />
        </div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-10" />

        <div className="container relative z-10 px-4 md:px-6">
          {/* Header Section */}
          <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
            {/* Badge */}
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <Store className="w-4 h-4 mr-2" />
              Explore Our Diverse Stores
            </Badge>

            {/* Main heading */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Discover Amazing{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Online Stores
                </span>
              </h1>
              <p className="max-w-[800px] text-muted-foreground text-lg md:text-xl leading-relaxed">
                Browse through a curated collection of unique shops, find your next favorite product, and support
                independent entrepreneurs.
              </p>
            </div>
          </div>

          {/* Store Cards Grid */}
          <div className="relative">
            {/* Decorative elements around the grid */}
            <div className="absolute -top-8 -left-8 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
            <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-secondary/10 rounded-full blur-xl" />

            {stores.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <Store className="h-16 w-16 text-muted-foreground mx-auto" />
                <h3 className="text-2xl font-semibold text-foreground">No Stores Found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  It looks like there are no stores available right now. Check back later or consider creating your own!
                </p>
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className={cn(
                      "group h-12 px-8 text-base font-medium transition-all duration-300",
                      "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                      "shadow-lg hover:shadow-xl hover:shadow-primary/25",
                      "hover:scale-105 active:scale-95",
                    )}
                  >
                    Start Your Own Store
                    <Store className="ml-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-10">
                {stores.map((store) => (
                  <div
                    key={store._id}
                    className={cn("group relative transition-all duration-500 hover:scale-105", "hover:z-10")}
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Enhanced store card wrapper */}
                    <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-1 transition-all duration-300 group-hover:bg-card/80 group-hover:border-border group-hover:shadow-2xl">
                      <StoreCard store={store} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Call to Action Section */}
          <div className="flex flex-col items-center justify-center space-y-6 mt-16">
            {/* Decorative line */}
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* CTA Content */}
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-lg">Can't find what you're looking for?</p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className={cn(
                      "group h-12 px-8 text-base font-medium transition-all duration-300",
                      "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                      "shadow-lg hover:shadow-xl hover:shadow-primary/25",
                      "hover:scale-105 active:scale-95",
                    )}
                  >
                    Start Your Own Store
                    <Store className="ml-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "group h-12 px-8 text-base font-medium transition-all duration-300",
                      "bg-background/50 backdrop-blur-sm border-border/50",
                      "hover:bg-background hover:border-border hover:shadow-lg",
                      "hover:scale-105 active:scale-95",
                    )}
                  >
                    Contact Support
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>
    </Reveal>
  )
}
