"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { StoreCard } from "@/components/store-card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Store,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Award,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FaWhatsapp } from "react-icons/fa";

interface StoreData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  sellerId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

interface HeroBanner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("🔍 Fetching stores and banner");

        // Fetch stores and hero banner in parallel
        const [storesRes, bannerRes] = await Promise.all([
          fetch("/api/stores", { signal: AbortSignal.timeout(15000) }),
          fetch("/api/hero-banner", {
            signal: AbortSignal.timeout(15000),
          }).catch(() => null),
        ]);

        // Handle stores response
        console.log("📡 Stores response status:", storesRes.status);

        if (!storesRes.ok) {
          const errorData = await storesRes.json().catch(() => ({
            message: `HTTP ${storesRes.status}: ${storesRes.statusText}`,
          }));
          throw new Error(
            errorData.message ||
              `Failed to fetch stores: ${storesRes.statusText}`
          );
        }

        const storesData = await storesRes.json();
        console.log("📦 Stores data received:", storesData);

        if (!storesData.success) {
          throw new Error(
            storesData.message || "API returned unsuccessful response"
          );
        }

        if (!Array.isArray(storesData.stores)) {
          throw new Error("Invalid response format: stores is not an array");
        }

        console.log("✅ Stores loaded:", storesData.stores.length);
        setStores(storesData.stores);

        // Handle banner response
        if (bannerRes && bannerRes.ok) {
          const bannerData = await bannerRes.json();
          if (bannerData.banner) {
            setHeroBanner(bannerData.banner);
            console.log("✅ Hero banner loaded");
          }
        }

        setError(null);
      } catch (err: any) {
        console.error("❌ Error fetching data:", err);

        if (err.name === "AbortError" || err.name === "TimeoutError") {
          setError(
            "Request timed out. Please check your connection and try again."
          );
        } else if (err.message.includes("fetch")) {
          setError(
            "Network error. Please check your connection and try again."
          );
        } else {
          setError(
            err.message || "Failed to load stores. Please try again later."
          );
        }

        setStores([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-muted border-t-[#e1a200] rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="w-8 h-8 text-[#e1a200] animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Loading stores...</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we fetch the latest stores
            </p>
          </div>
        </div>
      </div>
    );
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
              className="bg-[#e1a200] hover:bg-[#e1a200]/90"
            >
              Try Again
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section with Dynamic Banner */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden">
        {heroBanner?.imageUrl ? (
          <>
            {/* Background Image */}
            <Image
              src={heroBanner.imageUrl}
              alt={heroBanner.title || "Hero Banner"}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />

            {/* Content */}
            <div className="relative container mx-auto px-4 py-12 h-full flex flex-col items-center justify-center text-center text-white">
              <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16 md:mb-20">
                {/* Badge */}
                <Badge
                  variant="secondary"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#e1a200]/10 to-primary/10 text-foreground border-[#e1a200]/30 hover:from-[#e1a200]/20 hover:to-primary/20 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-[#e1a200]" />
                  Explore Our Marketplace
                </Badge>

                {/* Main Heading */}
                <div className="space-y-4 max-w-3xl">
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                    <span className="block text-3xl md:text-4xl lg:text-6xl font-bold mb-3 tracking-tight drop-shadow-lg">
                      Discover Premium
                    </span>
                    <span className="block mt-2 bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] bg-clip-text text-transparent">
                      Online Stores
                    </span>
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    Browse through a curated collection of trusted shops. Find
                    quality products and support independent entrepreneurs
                    building their dreams.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Fallback gradient design
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#e1a200]/30 via-[#e1a200]/10 to-primary/5">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-[#e1a200] rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary rounded-full blur-3xl" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16 md:mb-20">
              {/* Badge */}
              <Badge
                variant="secondary"
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#e1a200]/10 to-primary/10 text-foreground border-[#e1a200]/30 hover:from-[#e1a200]/20 hover:to-primary/20 transition-all duration-300 backdrop-blur-sm shadow-sm hover:shadow-md"
              >
                <Sparkles className="w-4 h-4 mr-2 text-[#e1a200]" />
                Explore Our Marketplace
              </Badge>

              {/* Main Heading */}
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  <span className="block bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                    Discover Premium
                  </span>
                  <span className="block mt-2 bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] bg-clip-text text-transparent">
                    Online Stores
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Browse through a curated collection of trusted shops. Find
                  quality products and support independent entrepreneurs
                  building their dreams.
                </p>
              </div>
            </div>
          </>
        )}
      </div>


      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 lg:px-8" id="stores">
        <div className="flex gap-6">
          {/* Sidebar - Filters & Ads */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-8 space-y-6">
              

              {/* Ad Space 1 */}
              <div className="border-0 shadow-sm rounded-2xl p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
                <div className="text-xs font-bold mb-1 text-orange-700 dark:text-orange-300 uppercase tracking-wide">
                  PROMOTE HERE
                </div>
                <h3 className="text-xl font-bold mb-2 text-orange-900 dark:text-orange-100">
                  Advertise Your Brand
                </h3>
                <p className="text-sm mb-4 text-orange-700 dark:text-orange-300">
                  Reach thousands of customers
                </p>
                <Link
                  href="https://wa.me/2348071427831"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="bg-[#e1a200] text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#e1a200]/90 transition shadow-lg w-full">
                    Get Started
                  </button>
                </Link>
              </div>

              {/* Ad Space 2 */}
              <div className="border-0 shadow-sm rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
                <div className="text-xs font-bold mb-1 text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  FEATURED
                </div>
                <h3 className="text-xl font-bold mb-2 text-purple-900 dark:text-purple-100">
                  Become a Seller
                </h3>
                <p className="text-sm mb-4 text-purple-700 dark:text-purple-300">
                  Start your online store today
                </p>
                <Link href="/auth/register">
                  <button className="bg-[#e1a200] text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#e1a200]/90 transition shadow-lg w-full">
                    Join Now
                  </button>
                </Link>
              </div>
            </div>
          </aside>

          {/* Stores Grid */}
          <main className="flex-1 min-w-0">

            {/* Banner Ad Space */}
            <div className="border-0 shadow-lg rounded-2xl p-6 md:p-8 mb-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold mb-2 text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                    SPECIAL PROMOTION
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-blue-900 dark:text-blue-100">
                    Advertise Your Business Here
                  </h2>
                  <p className="text-blue-700 dark:text-blue-300 mb-4">
                    Get maximum visibility to thousands of shoppers
                  </p>
                  <Link
                    href="https://wa.me/2348071427831"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button className="bg-[#e1a200] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e1a200]/90 transition shadow-lg">
                      Contact Us
                    </button>
                  </Link>
                </div>
                <div className="hidden md:block text-5xl">📢</div>
              </div>
            </div>

            {/* Stores */}
            {stores.length === 0 ? (
              <div className="text-center py-20 space-y-6 max-w-2xl mx-auto">
                <div className="inline-flex p-4 rounded-full bg-muted/50">
                  <Store className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                    No Stores Available Yet
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Be the first to create a store on our platform. Start your
                    entrepreneurial journey today and reach thousands of
                    potential customers.
                  </p>
                </div>
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className={cn(
                      "group h-12 px-8 text-base font-semibold transition-all duration-300",
                      "bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] bg-size-200 bg-pos-0 hover:bg-pos-100",
                      "shadow-lg hover:shadow-xl hover:shadow-[#e1a200]/30",
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
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                  {stores.map((store, index) => (
                    <div
                      key={store._id}
                      className="group relative transition-all duration-300 hover:scale-[1.02]"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#e1a200]/20 via-transparent to-primary/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative bg-card border-2 border-border rounded-xl overflow-hidden transition-all duration-300 group-hover:border-[#e1a200]/50 group-hover:shadow-xl group-hover:shadow-[#e1a200]/10">
                        <StoreCard store={store} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mid-content Ad Space */}
                <div className="border-0 shadow-lg rounded-2xl p-6 md:p-8 mb-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                      <div className="text-xs font-bold mb-2 text-green-700 dark:text-green-300 uppercase tracking-wide">
                        GROW YOUR BUSINESS
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-2 text-green-900 dark:text-green-100">
                        Premium Store Listings
                      </h2>
                      <p className="text-green-700 dark:text-green-300 mb-4">
                        Stand out with featured placement and get more customers
                      </p>
                      <Link
                        href="https://wa.me/2348071427831"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button className="bg-[#e1a200] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e1a200]/90 transition shadow-lg">
                          Upgrade Now
                        </button>
                      </Link>
                    </div>
                    <div className="text-6xl md:text-7xl">🚀</div>
                  </div>
                </div>

                {/* Bottom Newsletter Ad */}
                <div className="mt-8 border-0 shadow-lg rounded-2xl p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 text-center">
                  <h3 className="text-2xl font-bold mb-2 text-purple-900 dark:text-purple-100">
                    Stay Updated
                  </h3>
                  <p className="mb-4 text-purple-700 dark:text-purple-300">
                    Get notified about new stores and exclusive deals
                  </p>
                  <div className="max-w-md mx-auto flex gap-2">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 px-2 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[#e1a200] bg-background"
                    />
                    <button className="bg-[#e1a200] text-white px-2 py-3 rounded-xl font-bold hover:bg-[#e1a200]/90 transition shadow-lg">
                      Subscribe
                    </button>
                  </div>
                </div>

                {/* Call to Action Section */}
                <div className="relative mt-12">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#e1a200]/5 via-primary/5 to-[#e1a200]/5 rounded-3xl blur-3xl" />
                  <div className="relative bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 rounded-2xl p-8 md:p-12">
                    <div className="flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
                      <div className="inline-flex p-3 rounded-full bg-gradient-to-br from-[#e1a200]/20 to-primary/20">
                        <Store className="w-8 h-8 text-[#e1a200]" />
                      </div>

                      <div className="space-y-3">
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                          Ready to Start Your Journey?
                        </h2>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                          Join thousands of successful entrepreneurs. Create
                          your store in minutes and start selling today.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
                        <Link
                          href="/auth/register"
                          className="w-full sm:w-auto"
                        >
                          <Button
                            size="lg"
                            className={cn(
                              "group w-full sm:w-auto h-12 px-8 text-base font-semibold transition-all duration-300",
                              "bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] bg-size-200 bg-pos-0 hover:bg-pos-100",
                              "shadow-lg hover:shadow-xl hover:shadow-[#e1a200]/30",
                              "hover:scale-105 active:scale-95"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              Create Your Store
                              <Store className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </span>
                          </Button>
                        </Link>
                        <Link
                          href="https://wa.me/2348071427831"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto"
                        >
                          <Button
                            variant="outline"
                            size="lg"
                            className={cn(
                              "group w-full sm:w-auto h-12 px-8 text-base font-semibold transition-all duration-300",
                              "bg-background/80 backdrop-blur-sm border-2 border-border/50 hover:border-[#e1a200]/50",
                              "hover:bg-muted/50 hover:shadow-lg",
                              "hover:scale-105 active:scale-95"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <FaWhatsapp
                                size={20}
                                className="text-green-500"
                              />
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
          </main>
        </div>
      </div>

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
    </div>
  );
}