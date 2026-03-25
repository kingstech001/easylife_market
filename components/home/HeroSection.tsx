"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
  const [bannerKey, setBannerKey] = useState(0); // Used to trigger AnimatePresence

  // Function to fetch a new banner
  const fetchNewBanner = async () => {
    try {
      console.log("🔄 Fetching new hero banner...");
      setIsTransitioning(true);

      const bannerRes = await fetch("/api/hero-banner", {
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });

      if (bannerRes.ok) {
        const bannerData = await bannerRes.json();
        if (bannerData.banner) {
          setTimeout(() => {
            setHeroBanner(bannerData.banner);
            setBannerKey((prev) => prev + 1); // Trigger AnimatePresence
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

  // Refresh banner every minute
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("⏰ 1 minute passed, fetching new hero banner...");
      fetchNewBanner();
    }, 60000);
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
      {/* Hero Section — matches About page style */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">

        {/* ── Background Image with AnimatePresence transition ── */}
        <AnimatePresence mode="wait">
          {heroBanner?.imageUrl ? (
            <motion.div
              key={bannerKey}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 z-0"
            >
              <Image
                src={heroBanner.imageUrl}
                alt="Hero Background"
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              {/* Primary dark overlay — same as About */}
              <div className="absolute inset-0 bg-black/55" />
              {/* Directional brand gradient — same as About */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            </motion.div>
          ) : (
            /* Fallback gradient when no banner is loaded */
            <motion.div
              key="fallback"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 z-0 bg-gradient-to-b from-muted/30 via-background to-background"
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-64 h-64 bg-[#e1a200] rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-80 h-80 bg-foreground rounded-full blur-3xl animate-pulse" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content — matches About page container & padding ── */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 sm:space-y-8"
            >
              {/* Headline */}
              <div className="space-y-3 sm:space-y-4">
                <h1
                  className={cn(
                    "text-6xl md:text-6xl lg:text-7xl font-bold tracking-tight",
                    heroBanner?.imageUrl
                      ? "text-white drop-shadow-lg"
                      : "text-foreground"
                  )}
                >
                  Buy and Sell
                  <span className="block sm:ml-4 sm:inline text-5xl sm:text-6xl lg:text-7xl mt-2 bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] bg-clip-text text-transparent drop-shadow-lg">
                    Seamlessly <span className="text-white">with</span> EasyLife
                  </span>
                </h1>
                <p
                  className={cn(
                    "text-sm sm:text-xl max-w-2xl",
                    heroBanner?.imageUrl
                      ? "text-white/80 drop-shadow-md"
                      : "text-muted-foreground"
                  )}
                >
                  Build, customize, and launch your online store in minutes. Join thousands of successful entrepreneurs
                  who trust our platform to grow their business.
                </p>
              </div>

              {/* Search Bar */}
              <div className="max-w-2xl">
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products, stores, or categories..."
                    className={cn(
                      "h-14 pl-5 pr-29 text-[13px] rounded shadow-lg",
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
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-auto p-4 rounded bg-gradient-to-r from-[#e1a200] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#e1a200] shadow-lg"
                  >
                    <Search className="pointer-events-none" />
                  </Button>
                </form>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start pt-2">
                <Link href="/stores" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className={cn(
                      "w-full sm:w-auto h-12 px-8 text-base font-semibold",
                      "bg-[#e1a200] hover:bg-[#e1a200]/90 text-white",
                      "shadow-xl hover:shadow-2xl transition-all",
                    )}
                  >
                    Go to Market
                    <ShoppingBag className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "w-full sm:w-auto h-12 px-8 text-base font-semibold border-2 transition-all shadow-lg",
                      heroBanner?.imageUrl
                        ? "bg-white/10 backdrop-blur-sm border-white/40 text-white hover:bg-white/20 hover:border-white/50"
                        : "bg-background hover:bg-muted/50 hover:border-[#e1a200]/50"
                    )}
                  >
                    Create Store
                    <Store className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Dot indicators (same style as About page mobile dots) ── */}
        {heroBanner && (
          <div className="absolute bottom-6 right-6 flex gap-1.5 z-10">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  !isTransitioning
                    ? "w-6 h-1.5 bg-[#e1a200]"
                    : "w-1.5 h-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </section>
    </Reveal>
  );
}