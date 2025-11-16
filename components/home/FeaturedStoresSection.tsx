"use client"

import Link from "next/link"
import { ArrowRight, Star, TrendingUp, Users, Eye, Sparkles, Store, Award, Zap, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StoreCard } from "@/components/store-card"
import { Reveal } from "../Reveal"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Define the StoreData interface to match your IStore Mongoose model
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
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
      <section className="relative w-full py-12 sm:py-16 lg:py-24 flex items-center justify-center min-h-[60vh] bg-gradient-to-b from-background via-muted/10 to-background">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 sm:space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-[#c0a146]/20 border-t-[#c0a146] rounded-full shadow-lg"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Store className="w-10 h-10 sm:w-12 sm:h-12 text-[#c0a146] animate-pulse" />
              </motion.div>
              <div className="absolute inset-0 rounded-full bg-[#c0a146]/10 blur-2xl animate-pulse" />
            </motion.div>
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                Loading Featured Stores
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                Discovering our top-performing stores for you...
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="relative w-full py-12 sm:py-16 lg:py-24 flex items-center justify-center min-h-[60vh] bg-gradient-to-b from-background via-muted/10 to-background">
        <div className="container px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 sm:space-y-6 max-w-lg mx-auto p-6 sm:p-8 rounded-2xl border-2 border-destructive/30 bg-destructive/5"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <Store className="w-8 h-8 sm:w-10 sm:h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-destructive">
                Error Loading Stores
              </h3>
              <p className="text-sm sm:text-base text-destructive/80">{error}</p>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4 border-destructive/30 hover:bg-destructive/10"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <Reveal direction="down">
      <section className="relative w-full py-12 sm:py-16 lg:py-24 overflow-hidden">
        {/* Enhanced background with gradient and patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />

        {/* Animated background elements - Responsive */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[15%] -left-[15%] sm:top-[20%] sm:-left-[20%] w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-[#c0a146]/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[15%] -right-[15%] sm:bottom-[20%] sm:-right-[20%] w-72 h-72 sm:w-88 sm:h-88 lg:w-96 lg:h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] lg:w-[900px] h-[500px] sm:h-[700px] lg:h-[900px] bg-gradient-to-r from-[#c0a146]/3 via-transparent to-primary/3 rounded-full blur-3xl" />
        </div>

        {/* Subtle grid pattern - Responsive */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:2rem_2rem] sm:bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_110%)] opacity-10" />

        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
          {/* Header Section - Responsive */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center mb-12 sm:mb-16 lg:mb-20"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <Badge
                variant="secondary"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#c0a146]/10 to-primary/10 text-foreground border-[#c0a146]/30 hover:from-[#c0a146]/20 hover:to-primary/20 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
              >
                <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-[#c0a146] fill-[#c0a146]" />
                Top Performing Stores
              </Badge>
            </motion.div>

            {/* Main heading - Responsive typography */}
            <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4 max-w-4xl">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                <span className="block sm:inline bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                  Featured{" "}
                </span>
                <span className="block sm:inline mt-1 sm:mt-0 bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-primary bg-clip-text text-transparent">
                  Success Stories
                </span>
              </h2>
              <p className="max-w-[90%] sm:max-w-[85%] lg:max-w-[800px] mx-auto text-muted-foreground text-base sm:text-lg lg:text-xl leading-relaxed px-4 sm:px-0">
                Discover amazing stores built by entrepreneurs like you. Get inspired by their success and start your
                own journey today.
              </p>
            </motion.div>

            {/* Stats bar - Responsive */}
            <motion.div variants={itemVariants} className="w-full max-w-4xl">
              <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-4 sm:pt-6">
                {[
                  { icon: Store, label: "Live stores", value: "2,847", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
                  { icon: TrendingUp, label: "Avg. growth", value: "+156%", color: "text-[#c0a146]", bgColor: "bg-[#c0a146]/10" },
                  { icon: Users, label: "Happy customers", value: "50K+", color: "text-blue-500", bgColor: "bg-blue-500/10" },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="group p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 hover:border-[#c0a146]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#c0a146]/10 hover:-translate-y-1"
                  >
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                      <div className={cn(
                        "p-2.5 sm:p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
                        stat.bgColor
                      )}>
                        <stat.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", stat.color)} />
                      </div>
                      <div className="text-center sm:text-left flex-1">
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                          {stat.value}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Store Cards Grid - Responsive */}
          <div className="relative">
            {/* Decorative elements - Responsive */}
            <div className="absolute -top-6 -left-6 sm:-top-8 sm:-left-8 w-12 h-12 sm:w-16 sm:h-16 bg-[#c0a146]/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 w-16 h-16 sm:w-20 sm:h-20 bg-primary/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />

            {featuredStores.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 sm:py-16 lg:py-20 space-y-6 sm:space-y-8 max-w-2xl mx-auto"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-lg">
                  <Store className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    No Featured Stores Yet
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-4">
                    We're working on highlighting our best stores. Check back soon or be the first to get featured!
                  </p>
                </div>
                <Link href="/auth/register" className="inline-block">
                  <Button
                    size="lg"
                    className={cn(
                      "group h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300",
                      "bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] bg-size-200 bg-pos-0 hover:bg-pos-100",
                      "shadow-lg hover:shadow-xl hover:shadow-[#c0a146]/30",
                      "hover:scale-105 active:scale-95"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      Start Your Own Store
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                    </span>
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10"
              >
                {featuredStores.map((store, index) => (
                  <motion.div
                    key={store._id}
                    variants={itemVariants}
                    className={cn(
                      "group relative transition-all duration-500",
                      "hover:z-10",
                      index === 1 && "md:scale-[1.02] lg:scale-105" // Middle card slightly larger on desktop
                    )}
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-[#c0a146]/20 via-transparent to-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Featured badge for middle card */}
                    {index === 1 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                        <Badge className="bg-gradient-to-r from-[#c0a146] to-[#d4b55e] text-white shadow-lg px-3 py-1">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          <span className="text-xs sm:text-sm font-semibold">Featured</span>
                        </Badge>
                      </div>
                    )}

                    {/* Enhanced store card wrapper */}
                    <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl p-1 transition-all duration-300 group-hover:from-card/90 group-hover:to-card/60 group-hover:border-[#c0a146]/30 group-hover:shadow-2xl group-hover:shadow-[#c0a146]/10 hover:scale-[1.02] sm:hover:scale-105">
                      <StoreCard store={store} />
                    </div>

                    {/* Hover stats overlay - Hidden on mobile for cleaner look */}
                    <div className="hidden sm:block absolute inset-x-4 -bottom-3 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-xl">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                          </div>
                          <span className="text-muted-foreground">Views:</span>
                          <span className="font-semibold text-foreground">12.5K</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                          </div>
                          <span className="text-emerald-600 font-semibold">+23%</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Enhanced CTA Section - Responsive */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 mt-12 sm:mt-16 lg:mt-20"
          >
            {/* Decorative elements */}
            <div className="flex items-center gap-4 w-full max-w-md">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
              <div className="p-2 sm:p-2.5 rounded-full bg-gradient-to-br from-[#c0a146]/20 to-primary/20 shadow-lg">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#c0a146]" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-border via-border to-transparent" />
            </div>

            {/* CTA Content */}
            <div className="text-center space-y-4 sm:space-y-5 max-w-2xl px-4">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground via-[#c0a146] to-foreground bg-clip-text text-transparent">
                Ready to Join These Success Stories?
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                Start your journey today and become our next featured store
              </p>

              {/* Trust badges - Responsive */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 sm:pt-3">
                {["Free Trial", "Easy Setup", "24/7 Support"].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons - Responsive */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center pt-4 sm:pt-6 w-full max-w-md mx-auto sm:max-w-none">
                <Link href="/stores" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "group w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300",
                      "bg-background/80 backdrop-blur-sm border-2 border-border/50 hover:border-[#c0a146]/50",
                      "hover:bg-muted/50 hover:shadow-lg hover:shadow-[#c0a146]/10",
                      "hover:scale-105 active:scale-95"
                    )}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Explore All Stores
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                </Link>
                <Link href="/auth/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className={cn(
                      "group w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300",
                      "bg-gradient-to-r from-[#c0a146] via-[#d4b55e] to-[#c0a146] bg-size-200 bg-pos-0 hover:bg-pos-100",
                      "shadow-lg hover:shadow-xl hover:shadow-[#c0a146]/30",
                      "hover:scale-105 active:scale-95"
                    )}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Start Your Store
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                    </span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Trust indicators - Responsive
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-6 sm:pt-8 opacity-60 hover:opacity-100 transition-opacity">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">Trusted by:</p>
              <div className="flex items-center gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-14 h-7 sm:w-16 sm:h-8 bg-muted/50 rounded-lg border border-border/30 flex items-center justify-center hover:bg-muted/70 hover:border-border/50 transition-all"
                  >
                    <div className="w-7 h-1.5 sm:w-8 sm:h-2 bg-muted-foreground/30 rounded" />
                  </div>
                ))}
              </div>
            </div> */}
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 lg:h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        <style jsx>{`
          .bg-size-200 {
            background-size: 200%;
          }
          .bg-pos-0 {
            background-position: 0%;
          }
          .hover\\:bg-pos-100:hover {
            background-position: 100%;
          }
          @media (max-width: 475px) {
            .xs\\:grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }
        `}</style>
      </section>
    </Reveal>
  )
}