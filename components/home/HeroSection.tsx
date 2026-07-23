"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingBag,
  Store,
  Package,
} from "lucide-react";
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
const HERO_REMOTE_FETCH_DELAY_MS = 10000;
const STATIC_HERO_BANNERS: HeroBanner[] = [
  {
    id: "static-hero-1",
    imageUrl: "/africa-hero.jpg",
    title: "Shop trusted local stores",
    subtitle:
      "Find products, meals, groceries, and everyday essentials from verified sellers near you.",
    buttonText: "Shop Now",
    buttonLink: "/allStoreProducts",
  },
  {
    id: "static-hero-2",
    imageUrl: "/easylife-hero.jpg",
    title: "Discover products faster",
    subtitle:
      "Search stores, compare products, and checkout securely from one simple marketplace.",
    buttonText: "Browse Stores",
    buttonLink: "/stores",
  },
];

function preloadImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve();
    image.onerror = () => reject();
    image.src = src;
  });
}

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [heroBanner, setHeroBanner] = useState<HeroBanner>(STATIC_HERO_BANNERS[0]);
  const [storeSuggestions, setStoreSuggestions] = useState<StoreSuggestion[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<ProductSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fetchRemoteBanner = useCallback(async () => {
    try {
      const bannerRes = await fetch("/api/hero-banner", {
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });

      if (!bannerRes.ok) {
        return;
      }

      const bannerData = await bannerRes.json();
      const nextBanner = bannerData.banner as HeroBanner | undefined;

      if (!nextBanner?.imageUrl) {
        return;
      }

      await preloadImage(nextBanner.imageUrl);
      setHeroBanner(nextBanner);
    } catch {
      setCurrentBannerIndex((index) => {
        const nextIndex = (index + 1) % STATIC_HERO_BANNERS.length;
        setHeroBanner(STATIC_HERO_BANNERS[nextIndex]);
        return nextIndex;
      });
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        fetchRemoteBanner();
      }
    }, HERO_REMOTE_FETCH_DELAY_MS);

    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }
      fetchRemoteBanner();
    }, HERO_BANNER_ROTATION_MS);

    return () => {
      window.clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, [fetchRemoteBanner]);

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

  const heroHeading = heroBanner?.title || "Shop trusted local stores";
  const heroSubheading =
    heroBanner?.subtitle ||
    "Find products, meals, groceries, and everyday essentials from verified sellers near you.";
  const showSuggestions =
    isSuggestionsOpen &&
    searchQuery.trim().length >= 2 &&
    (isLoadingSuggestions || storeSuggestions.length > 0 || productSuggestions.length > 0);

  return (
    <section className="relative z-40 flex min-h-[560px] items-center isolate sm:min-h-[640px]">
      {heroBanner?.imageUrl ? (
        <div
          key={heroBanner.id}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <img
            src={heroBanner.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-background" />
      )}

        <div className="relative z-10 container mx-auto px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-5xl">
            <div className="space-y-6 sm:space-y-7">
              <div className="max-w-3xl space-y-4">
                <h1
                  className={cn(
                    "text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl",
                    heroBanner?.imageUrl
                      ? "text-white drop-shadow-md"
                      : "text-foreground"
                  )}
                >
                  {heroHeading}
                  <span className="block text-[#F4C430]">
                    on EasyLife
                  </span>
                </h1>
                <p
                  className={cn(
                    "max-w-2xl text-base leading-7 sm:text-lg",
                    heroBanner?.imageUrl
                      ? "text-white/85 drop-shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  {heroSubheading}
                </p>
              </div>

              <div ref={searchContainerRef} className="relative z-[90] max-w-2xl">
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSuggestionsOpen(true)}
                    placeholder="Search for products, stores, or categories..."
                    className={cn(
                      "h-14 rounded pl-5 pr-20 text-sm shadow-lg sm:pr-24",
                      "border-0 border-transparent",
                      "outline-none",
                      "ring-0 ring-offset-0",
                      "focus:border-0 focus:border-transparent focus:outline-none focus:ring-0 focus:ring-offset-0 focus:[box-shadow:none]",
                      "focus-visible:border-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:[box-shadow:none]",
                      "[box-shadow:none]",
                      "bg-white text-[#1F2937] placeholder:text-muted-foreground",
                    )}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="absolute right-1 top-1/2 h-auto -translate-y-1/2 rounded bg-[#0E5A43] p-4 text-white shadow-lg hover:bg-[#083B2D]"
                  >
                    <Search className="pointer-events-none" />
                  </Button>
                </form>

                {showSuggestions && (
                  <div className="absolute z-[100] mt-2 w-full overflow-hidden rounded-xl border border-white/20 bg-black/80 shadow-2xl backdrop-blur-md">
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
                                <Store className="h-4 w-4 text-[#0E5A43]" />
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
                                    <Package className="h-4 w-4 text-[#0E5A43]" />
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

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {heroBanner?.buttonLink && heroBanner?.buttonText && (
                  <Link href={heroBanner.buttonLink} className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="h-12 w-full bg-[#0E5A43] px-6 text-base font-semibold text-white shadow-lg hover:bg-[#083B2D] sm:w-auto"
                    >
                      {heroBanner.buttonText}
                      <ShoppingBag className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "h-12 w-full border-white/40 px-6 text-base font-semibold transition-all sm:w-auto",
                      heroBanner?.imageUrl
                        ? "bg-white/10 text-white hover:bg-white hover:text-[#083B2D]"
                        : "bg-background hover:bg-muted/50 hover:border-[#0E5A43]/50"
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

        {heroBanner && (
          <div className="hidden absolute bottom-6 right-6 sm:flex gap-1.5 z-10">
            {STATIC_HERO_BANNERS.map((banner, i) => (
              <div
                key={banner.id}
                className={`rounded-full transition-all duration-300 ${
                  i === currentBannerIndex
                    ? "w-6 h-1.5 bg-[#0E5A43]"
                    : "w-1.5 h-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </section>
  );
}
