"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  Package,
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

interface StoreSuggestion {
  _id: string;
  businessName: string;
  slug?: string;
}

interface ProductSuggestion {
  _id: string;
  name: string;
  storeSlug?: string;
  image?: string | null;
}

const HERO_BANNER_ROTATION_MS = 30000;
const HERO_BANNER_SWAP_DELAY_MS = 300;

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [bannerKey, setBannerKey] = useState(0);
  const [storeSuggestions, setStoreSuggestions] = useState<StoreSuggestion[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<ProductSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fetchNewBanner = useCallback(async () => {
    try {
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
            setBannerKey((prev) => prev + 1);
            setIsTransitioning(false);
          }, HERO_BANNER_SWAP_DELAY_MS);
        }
      }
    } catch {
      setIsTransitioning(false);
    }
  }, []);

  useEffect(() => {
    fetchNewBanner();
  }, [fetchNewBanner]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }
      fetchNewBanner();
    }, HERO_BANNER_ROTATION_MS);

    return () => clearInterval(interval);
  }, [fetchNewBanner]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < 2) {
      setStoreSuggestions([]);
      setProductSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const debounce = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`);
        if (!response.ok) {
          setStoreSuggestions([]);
          setProductSuggestions([]);
          return;
        }

        const data = await response.json();
        setStoreSuggestions((data.stores || []).slice(0, 4));
        setProductSuggestions((data.products || []).slice(0, 4));
      } catch {
        setStoreSuggestions([]);
        setProductSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchContainerRef.current) {
        return;
      }

      if (!searchContainerRef.current.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      setIsSuggestionsOpen(false);
      router.push(`/Search?search=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleSuggestionClick = (path: string) => {
    setIsSuggestionsOpen(false);
    router.push(path);
  };

  const heroHeading = heroBanner?.title || "Buy and Sell";
  const heroSubheading =
    heroBanner?.subtitle ||
    "Build, customize, and launch your online store in minutes. Join thousands of successful entrepreneurs who trust our platform to grow their business.";
  const showSuggestions =
    isSuggestionsOpen &&
    searchQuery.trim().length >= 2 &&
    (isLoadingSuggestions || storeSuggestions.length > 0 || productSuggestions.length > 0);

  return (
    <Reveal>
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
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
              <div className="absolute inset-0 bg-black/55" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            </motion.div>
          ) : (
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

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 sm:space-y-8"
            >
              <div className="space-y-3 sm:space-y-4">
                <h1
                  className={cn(
                    "text-6xl md:text-6xl lg:text-7xl font-bold tracking-tight",
                    heroBanner?.imageUrl
                      ? "text-white drop-shadow-lg"
                      : "text-foreground"
                  )}
                >
                  {heroHeading}
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
                  {heroSubheading}
                </p>
              </div>

              <div ref={searchContainerRef} className="max-w-2xl relative">
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSuggestionsOpen(true)}
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

                {showSuggestions && (
                  <div className="absolute mt-2 w-full rounded-xl border border-white/20 bg-black/80 backdrop-blur-md shadow-2xl overflow-hidden z-20">
                    {isLoadingSuggestions ? (
                      <div className="px-4 py-3 text-sm text-white/70">Searching...</div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto">
                        {storeSuggestions.length > 0 && (
                          <div className="border-b border-white/10">
                            <p className="px-4 pt-3 pb-2 text-xs uppercase tracking-wide text-white/60">Stores</p>
                            {storeSuggestions.map((store) => (
                              <button
                                key={store._id}
                                type="button"
                                className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors flex items-center gap-2 text-white"
                                onClick={() => handleSuggestionClick(`/stores/${store.slug || store._id}`)}
                              >
                                <Store className="h-4 w-4 text-[#e1a200]" />
                                <span className="truncate">{store.businessName}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {productSuggestions.length > 0 && (
                          <div>
                            <p className="px-4 pt-3 pb-2 text-xs uppercase tracking-wide text-white/60">Products</p>
                            {productSuggestions.map((product) => (
                              <button
                                key={product._id}
                                type="button"
                                className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors flex items-center gap-3 text-white"
                                onClick={() =>
                                  handleSuggestionClick(
                                    product.storeSlug
                                      ? `/stores/${product.storeSlug}/products/${product._id}`
                                      : `/Search?search=${encodeURIComponent(product.name)}`
                                  )
                                }
                              >
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-8 w-8 rounded object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Package className="h-4 w-4 text-[#e1a200]" />
                                  </div>
                                )}
                                <span className="truncate">{product.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start pt-2">
                {/* <Link href="/stores" className="w-full sm:w-auto">
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
                </Link> */}
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
                {heroBanner?.buttonLink && heroBanner?.buttonText && (
                  <Link href={heroBanner.buttonLink} className="w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto h-12 px-8 text-base font-semibold"
                    >
                      {heroBanner.buttonText}
                      <ShoppingBag className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </div>

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
