// app/stores/StoresPageClient.tsx
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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface StoresPageClientProps {
  initialStores: StoreData[];
}

export default function StoresPageClient({ initialStores }: StoresPageClientProps) {
  const stores = initialStores;
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Function to fetch a new banner
  const fetchNewBanner = async () => {
    try {
      console.log("🔄 Fetching new banner...");
      setIsTransitioning(true);

      const bannerRes = await fetch("/api/hero-banner", {
        signal: AbortSignal.timeout(10000),
        cache: "no-store", // Always fetch fresh banner
      });

      if (bannerRes.ok) {
        const bannerData = await bannerRes.json();
        if (bannerData.banner) {
          // Small delay for smooth transition
          setTimeout(() => {
            setHeroBanner(bannerData.banner);
            setIsTransitioning(false);
            console.log("✅ New banner loaded:", bannerData.source);
          }, 300);
        }
      }
    } catch (err) {
      console.log("⚠️ Banner fetch failed, keeping current banner");
      setIsTransitioning(false);
    }
  };

  // Initial banner fetch
  useEffect(() => {
    fetchNewBanner();
  }, []);

  // Set up interval to change banner every minute (60000ms)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("⏰ 1 minute passed, fetching new banner...");
      fetchNewBanner();
    }, 60000); // 60 seconds = 1 minute

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section with Dynamic Banner */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden">
        {heroBanner?.imageUrl ? (
          <>
            {/* Background Image with transition */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              <Image
                key={heroBanner.id} // Force re-render on banner change
                src={heroBanner.imageUrl}
                alt={heroBanner.title || "Hero Banner"}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />

            {/* Content */}
            <div className="relative container mx-auto px-4 py-12 h-full flex flex-col items-center justify-center text-center text-white">
              <div className="flex flex-col items-center justify-center space-y-6 text-center">
                {/* Badge */}
                <Badge
                  variant="secondary"
                  className="px-4 py-2 text-sm font-medium bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 transition-all duration-300 shadow-lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Explore Our Marketplace
                </Badge>

                {/* Main Heading */}
                <div className="space-y-4 max-w-3xl">
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                    <span className="block text-3xl md:text-4xl lg:text-6xl font-bold mb-3 tracking-tight drop-shadow-lg">
                      {heroBanner.title || "Discover Premium"}
                    </span>
                    <span className="block mt-2 bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] bg-clip-text text-transparent drop-shadow-lg">
                      {heroBanner.subtitle || "Online Stores"}
                    </span>
                  </h1>
                  <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
                    Browse through a curated collection of trusted shops. Find
                    quality products and support independent entrepreneurs
                    building their dreams.
                  </p>
                </div>

                {/* Optional CTA Button from banner */}
                {heroBanner.buttonText && heroBanner.buttonLink && (
                  <Link href={heroBanner.buttonLink}>
                    <Button
                      size="lg"
                      className="bg-[#e1a200] hover:bg-[#e1a200]/90 text-white shadow-xl"
                    >
                      {heroBanner.buttonText}
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Banner Change Indicator (optional) */}
            <div className="absolute bottom-4 right-4 flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    !isTransitioning ? "bg-white/50" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </>
        ) : (
          // Fallback gradient design (shown while banner loads)
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#e1a200]/30 via-[#e1a200]/10 to-primary/5">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-[#e1a200] rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary rounded-full blur-3xl animate-pulse" />
              </div>
            </div>

            <div className="relative container mx-auto px-4 py-12 h-full flex flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center space-y-6 text-center">
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
            </div>
          </>
        )}
      </div>

      {/* Main Content - Rest of your existing code */}
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

                {/* Rest of the content (ads, CTA, etc.) - Keep your existing code */}
                {/* ... */}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}