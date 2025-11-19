"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { StoreCard } from "@/components/store-card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Store, AlertCircle, Search, Filter, TrendingUp, Users, Zap, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/Reveal"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface StoreData {
  _id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  sellerId: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
  productCount?: number
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStores() {
      try {
        console.log("🔍 Fetching stores from /api/stores")
        
        const res = await fetch("/api/stores", {
          signal: AbortSignal.timeout(15000),
        })
        
        console.log("📡 Response status:", res.status)

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({
            message: `HTTP ${res.status}: ${res.statusText}`
          }))
          throw new Error(errorData.message || `Failed to fetch stores: ${res.statusText}`)
        }

        const data = await res.json()
        console.log("📦 Data received:", data)

        if (!data.success) {
          throw new Error(data.message || "API returned unsuccessful response")
        }

        if (!Array.isArray(data.stores)) {
          throw new Error("Invalid response format: stores is not an array")
        }

        console.log("✅ Stores loaded:", data.stores.length)
        setStores(data.stores)
        setError(null)
      } catch (err: any) {
        console.error("❌ Error fetching stores:", err)
        
        if (err.name === "AbortError" || err.name === "TimeoutError") {
          setError("Request timed out. Please check your connection and try again.")
        } else if (err.message.includes("fetch")) {
          setError("Network error. Please check your connection and try again.")
        } else {
          setError(err.message || "Failed to load stores. Please try again later.")
        }
        
        setStores([])
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-muted border-t-[#c0a146] rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="w-8 h-8 text-[#c0a146] animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Loading stores...</h3>
            <p className="text-sm text-muted-foreground">Please wait while we fetch the latest stores</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>Error Loading Stores</strong>
              <p className="mt-2">{error}</p>
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              variant="default"
              className="bg-[#c0a146] hover:bg-[#c0a146]/90"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = "/"} 
              variant="outline"
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main content
  return (
    <Reveal direction="down">
      <section className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        {/* Subtle background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-[#c0a146]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-10" />

        <div className="container relative z-10 px-4 md:px-6 py-16 md:py-24 mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16 md:mb-20">
            {/* Badge */}
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#c0a146]/10 to-primary/10 text-foreground border-[#c0a146]/30 hover:from-[#c0a146]/20 hover:to-primary/20 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
            >
              <Sparkles className="w-4 h-4 mr-2 text-[#c0a146]" />
              Explore Our Marketplace
            </Badge>

            {/* Main Heading */}
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                <span className="block bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                  Discover Premium
                </span>
                <span className="block mt-2 bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] bg-clip-text text-transparent">
                  Online Stores
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Browse through a curated collection of trusted shops. Find quality products and support independent entrepreneurs building their dreams.
              </p>
            </div>
          </div>

          {/* Store Cards Grid */}
          {stores.length === 0 ? (
            <div className="text-center py-20 space-y-6 max-w-2xl mx-auto">
              <div className="inline-flex p-4 rounded-full bg-muted/50">
                <Store className="h-16 w-16 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">No Stores Available Yet</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Be the first to create a store on our platform. Start your entrepreneurial journey today and reach thousands of potential customers.
                </p>
              </div>
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className={cn(
                    "group h-12 px-8 text-base font-semibold transition-all duration-300",
                    "bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] bg-size-200 bg-pos-0 hover:bg-pos-100",
                    "shadow-lg hover:shadow-xl hover:shadow-[#c0a146]/30",
                    "hover:scale-105 active:scale-95"
                  )}
                >
                  <span className="flex items-center gap-2">
                    Launch Your Store
                    <Store className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Stores Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-16">
                {stores.map((store, index) => (
                  <div
                    key={store._id}
                    className="group relative transition-all duration-300 hover:scale-[1.02]"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#c0a146]/20 via-transparent to-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 group-hover:border-[#c0a146]/50 group-hover:shadow-xl group-hover:shadow-[#c0a146]/10">
                      <StoreCard store={store} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Call to Action Section */}
              <div className="relative mt-20">
                <div className="absolute inset-0 bg-gradient-to-r from-[#c0a146]/5 via-primary/5 to-[#c0a146]/5 rounded-3xl blur-3xl" />
                <div className="relative bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 rounded-2xl p-8 md:p-12">
                  <div className="flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
                    <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-[#c0a146]/20 to-primary/20">
                      <Store className="w-8 h-8 text-[#c0a146]" />
                    </div>
                    
                    <div className="space-y-3">
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                        Ready to Start Your Journey?
                      </h2>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        Join thousands of successful entrepreneurs. Create your store in minutes and start selling today.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
                      <Link href="/auth/register" className="w-full sm:w-auto">
                        <Button
                          size="lg"
                          className={cn(
                            "group w-full sm:w-auto h-12 px-8 text-base font-semibold transition-all duration-300",
                            "bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] bg-size-200 bg-pos-0 hover:bg-pos-100",
                            "shadow-lg hover:shadow-xl hover:shadow-[#c0a146]/30",
                            "hover:scale-105 active:scale-95"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            Create Your Store
                            <Store className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                          </span>
                        </Button>
                      </Link>
                      <Link href="/contact" className="w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="lg"
                          className={cn(
                            "group w-full sm:w-auto h-12 px-8 text-base font-semibold transition-all duration-300",
                            "bg-background/80 backdrop-blur-sm border-2 border-border/50 hover:border-[#c0a146]/50",
                            "hover:bg-muted/50 hover:shadow-lg",
                            "hover:scale-105 active:scale-95"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            Contact Support
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                          </span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      <style jsx>{`
        .bg-size-200 {
          background-size: 200%;
        }

        .bg-pos-0 {
          background-position: 0%;
        }

        .hover\:bg-pos-100:hover {
          background-position: 100%;
        }
      `}</style>
    </Reveal>
  )
}