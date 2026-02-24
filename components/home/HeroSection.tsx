"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Reveal } from "../Reveal";
import { cn } from "@/lib/utils";

interface HeroBanner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
}

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Function to fetch a new banner
  const fetchNewBanner = async () => {
    try {
      console.log("🔄 Fetching new hero banner...");
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
            console.log("✅ New hero banner loaded:", bannerData.source);
          }, 300);
        }
      }
    } catch (err) {
      console.log("⚠️ Hero banner fetch failed, using fallback design");
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
      console.log("⏰ 1 minute passed, fetching new hero banner...");
      fetchNewBanner();
    }, 60000); // 60 seconds = 1 minute

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/Search?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Reveal>
      {/* Hero Section */}
      <section className="relative flex items-center justify-center bg-background overflow-hidden">
        {/* Background Image or Gradient */}
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
                alt="Hero Background"
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
            
            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0a0a0a]" />
          </>
        ) : (
          // Fallback gradient design
          <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-64 h-64 bg-[#e1a200] rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-10 right-10 w-80 h-80 bg-foreground rounded-full blur-3xl animate-pulse" />
            </div>
          </div>
        )}

        <div className="container relative z-10 pt-12 px-4 sm:px-6 md:px-8 sm:pt-16 lg:pt-10">
          <div className="max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="text-center space-y-6 sm:space-y-8 mb-10 sm:mb-12">
              {/* Headline */}
              <div className="space-y-3 sm:space-y-4">
                <h1
                  className={cn(
                    "text-3xl md:text-6xl lg:text-7xl font-bold tracking-tight",
                    heroBanner?.imageUrl
                      ? "text-white drop-shadow-lg"
                      : "text-foreground"
                  )}
                >
                  Buy and Sell
                  <span className="block mt-2 bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] bg-clip-text text-transparent drop-shadow-lg">
                    Seamlessly <span className="text-white">with</span> EasyLife
                  </span>
                </h1>
                <p
                  className={cn(
                    "text-sm sm:text-xl max-w-2xl mx-auto",
                    heroBanner?.imageUrl
                      ? "text-white/90 drop-shadow-md"
                      : "text-muted-foreground"
                  )}
                >
                  Build, customize, and launch your online store in minutes. Join thousands of successful entrepreneurs
                  who trust our platform to grow their business.
                </p>
              </div>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products, stores, or categories..."
                    className={cn(
                        "h-14 pl-5 pr-29 text-[13px] rounded-full shadow-lg",
                        "border-0 border-transparent",
                        "outline-none",
                        "ring-0 ring-offset-0",
                        "focus:border-0 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 focus:[box-shadow:none]",
                        "focus-visible:border-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:[box-shadow:none]",
                        "[box-shadow:none]",
                        "bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60",
                      )}
                      />
                  <Button
                    type="submit"
                    size="lg"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-auto p-4 rounded-full bg-gradient-to-r from-[#e1a200] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#e1a200] shadow-lg"
                  >
                    <Search className="pointer-events-none" />
                  </Button>
                </form>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2">
                <Link href="/allStoreProducts" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className={cn(
                      "w-full sm:w-auto h-12 px-8 text-base font-semibold",
                      "bg-gradient-to-r from-[#e1a200] to-[#d4b55e]",
                      "hover:from-[#d4b55e] hover:to-[#e1a200]",
                      "shadow-xl hover:shadow-2xl transition-all rounded-full",
                    )}
                  >
                    Browse Products
                    <ShoppingBag className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "w-full sm:w-auto h-12 px-8 text-base font-semibold border-2 transition-all shadow-lg rounded-full",
                      heroBanner?.imageUrl
                        ? "bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                        : "bg-background hover:bg-muted/50 hover:border-[#e1a200]/50"
                    )}
                  >
                    Create Store
                    <Store className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Change Indicator (optional) */}
        {heroBanner && (
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
        )}
      </section>
    </Reveal>
  );
}