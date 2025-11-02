"use client"

import Link from "next/link"
import { ArrowRight, Star, TrendingUp, Users, Eye, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StoreCard } from "@/components/store-card"
import { Reveal } from "../Reveal"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Store } from "lucide-react" // Declare the Store variable
import { motion, AnimatePresence } from "framer-motion"

// Define the StoreData interface to match your IStore Mongoose model
interface StoreData {
  _id: string // MongoDB's default ID
  name: string
  slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  sellerId: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export default function FeaturedStoresSection() {
  const [featuredStores, setFeaturedStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFeaturedStores() {
      try {
        const res = await fetch("/api/featured-stores")
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: "Unknown error" }))
          throw new Error(errorData.message || `Failed to fetch featured stores: ${res.statusText}`)
        }
        const data = await res.json()
        // Take the first 3 stores as featured, similar to previous mock data logic
        setFeaturedStores(data.stores.slice(0, 3))
      } catch (err: any) {
        console.error("Error fetching featured stores:", err)
        setError(err.message || "Failed to load featured stores. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchFeaturedStores()
  }, [])

  if (loading) {
    return (
      <section className="relative w-full py-16 md:py-24 lg:py-32 flex items-center justify-center min-h-[50vh] bg-background">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full mx-auto shadow-lg"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Store className="w-10 h-10 text-primary animate-pulse" />
            </motion.div>
          </motion.div>
          <h3 className="text-xl font-semibold text-foreground">Loading featured stores...</h3>
          <p className="text-muted-foreground">Showcasing our top picks.</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="relative w-full py-16 md:py-24 lg:py-32 flex items-center justify-center min-h-[50vh] bg-background">
        <div className="text-center space-y-4 p-6 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
          <h3 className="text-xl font-semibold">Error Loading Featured Stores</h3>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      </section>
    )
  }

  return (
    <Reveal direction="down">
      <section className="relative w-full py-16 md:py-24 lg:py-32 overflow-hidden block m-auto">
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

        <div className="container relative z-10 px-4 md:px-6 block m-auto">
          {/* Header Section */}
          <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
            {/* Badge */}
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <Star className="w-4 h-4 mr-2 fill-current" />
              Top Performing Stores
            </Badge>

            {/* Main heading */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Featured{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Success Stories
                </span>
              </h2>
              <p className="max-w-[800px] text-muted-foreground text-lg md:text-xl leading-relaxed">
                Discover amazing stores built by entrepreneurs like you. Get inspired by their success and start your
                own journey today.
              </p>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-muted-foreground">Live stores:</span>
                <span className="font-semibold">2,847</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Avg. growth:</span>
                <span className="font-semibold text-green-600">+156%</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Happy customers:</span>
                <span className="font-semibold">50K+</span>
              </div>
            </div>
          </div>

          {/* Enhanced Store Cards Grid */}
          <div className="relative">
            {/* Decorative elements around the grid */}
            <div className="absolute -top-8 -left-8 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
            <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-secondary/10 rounded-full blur-xl" />

            {featuredStores.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <Store className="h-16 w-16 text-muted-foreground mx-auto" /> // Use the declared Store variable
                <h3 className="text-2xl font-semibold text-foreground">No Featured Stores Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We're working on highlighting our best stores. Check back soon!
                </p>
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className={cn(
                      "group h-12 px-8 text-base font-medium transition-all duration-300",
                      "bg-gradient-to-r from-background to-background/90 hover:from-primary/90 hover:to-primary",
                      "shadow-lg hover:shadow-xl hover:shadow-primary/25",
                      "hover:scale-105 active:scale-95",
                    )}
                  >
                    Start Your Own Store
                    <Sparkles className="ml-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
                {featuredStores.map((store, index) => (
                  <div
                    key={store._id}
                    className={cn(
                      "group relative transition-all duration-500 hover:scale-105",
                      "hover:z-10",
                      index === 1 && "md:scale-105 lg:scale-110", // Make middle card slightly larger
                    )}
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Featured badge for middle card */}
                    {index === 1 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                        <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}

                    {/* Enhanced store card wrapper */}
                    <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-1 transition-all duration-300 group-hover:bg-card/80 group-hover:border-border group-hover:shadow-2xl">
                      <StoreCard store={store} />
                    </div>

                    {/* Hover stats overlay */}
                    <div className="absolute inset-x-4 -bottom-2 bg-card/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Views:</span>
                          <span className="font-medium">12.5K</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-green-600 font-medium">+23%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced CTA Section */}
          <div className="flex flex-col items-center justify-center space-y-6 mt-16">
            {/* Decorative line */}
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* CTA Content */}
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-lg">Ready to join these successful entrepreneurs?</p>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Link href="/stores">
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
                    Explore All Stores
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className={cn(
                      "group h-12 px-8 text-base font-medium transition-all duration-300",
                      "bg-gradient-to-r from-[#c0a146] to-[#c0a146]/90 ",
                      "shadow-lg hover:shadow-xl hover:shadow-[#c0a146]/25",
                      "hover:scale-105 active:scale-95",
                    )}
                  >
                    Start Your Store
                    <Sparkles className="ml-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 opacity-60">
              <div className="text-xs text-muted-foreground">Trusted by:</div>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-16 h-8 bg-muted/50 rounded border border-border/30 flex items-center justify-center"
                >
                  <div className="w-8 h-2 bg-muted-foreground/30 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>
    </Reveal>
  )
}
