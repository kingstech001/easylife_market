"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StoreCard } from "@/components/store-card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Search,
  Store,
  X,
  Sparkles,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface DaySchedule {
  open: boolean;
  openTime: string;
  closeTime: string;
}

interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

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
  businessHours?: BusinessHours;
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

const HERO_ROTATION_MS = 60000;
const HERO_SWAP_DELAY_MS = 100;

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function StoresPageClient({ initialStores }: StoresPageClientProps) {
  const router = useRouter();
  const stores = initialStores;
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const fetchNewBanner = async () => {
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
            setIsTransitioning(false);
          }, HERO_SWAP_DELAY_MS);
        }
      } else {
        setIsTransitioning(false);
      }
    } catch {
      setIsTransitioning(false);
    }
  };

  useEffect(() => { fetchNewBanner(); }, []);
  useEffect(() => {
    const interval = setInterval(fetchNewBanner, HERO_ROTATION_MS);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.push(`/Search?search=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {heroBanner?.imageUrl ? (
            <>
              <div className={cn("absolute inset-0 transition-opacity duration-700 hidden lg:block", isTransitioning ? "opacity-0" : "opacity-100")}>
                <Image
                  key={heroBanner.id}
                  src={heroBanner.imageUrl}
                  alt={heroBanner.title || "Stores"}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/60 hidden lg:block" />
              <div className="absolute inset-0 bg-background lg:hidden" />
            </>
          ) : (
            <div className="absolute inset-0 bg-background lg:bg-[#0E5A43]/10" />
          )}
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-4 lg:pt-20 lg:pb-16">
          {/* Heading — desktop only */}
          <div className="max-w-2xl hidden lg:block">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-5">
              <Sparkles className="h-3 w-3 text-[#f6cf66]" />
              <span className={cn("text-xs font-medium", heroBanner?.imageUrl ? "text-white/80" : "text-foreground/60")}>
                Discover trusted stores
              </span>
            </div>

            <h1 className={cn(
              "text-5xl font-bold tracking-tight leading-[1.15]",
              heroBanner?.imageUrl ? "text-white" : "text-foreground"
            )}>
              {heroBanner?.title || "Explore stores across the marketplace"}
            </h1>
            <p className={cn(
              "mt-4 text-lg max-w-xl leading-relaxed",
              heroBanner?.imageUrl ? "text-white/70" : "text-muted-foreground"
            )}>
              {heroBanner?.subtitle || "Browse growing brands, local vendors, and premium sellers in one place."}
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="lg:mt-8 max-w-lg">
            <div className={cn(
              "flex items-center h-12 sm:h-13 rounded-xl overflow-hidden transition-all",
              heroBanner?.imageUrl
                ? "bg-muted/50 border border-border/60 lg:bg-white/10 lg:backdrop-blur-md lg:border-white/15"
                : "bg-muted/50 border border-border/60",
              searchFocused && "ring-2 ring-[#0E5A43]/20 border-[#0E5A43]",
              searchFocused && heroBanner?.imageUrl && "lg:ring-[#0E5A43]/40 lg:border-[#0E5A43]/30"
            )}>
              <Search className={cn("ml-3.5 h-4 w-4 flex-shrink-0 text-muted-foreground", heroBanner?.imageUrl && "lg:text-white/40")} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search stores, products..."
                className={cn(
                  "flex-1 h-full px-3 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground",
                  heroBanner?.imageUrl && "lg:text-white lg:placeholder:text-white/40"
                )}
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="p-1.5 mr-1 rounded-md hover:bg-muted lg:hover:bg-white/10">
                  <X className={cn("h-3.5 w-3.5 text-muted-foreground", heroBanner?.imageUrl && "lg:text-white/50")} />
                </button>
              )}
              <button
                type="submit"
                className="h-full px-4 sm:px-5 bg-[#0E5A43] text-white hover:bg-[#083B2D] text-white text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <span className="hidden sm:inline">Search</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Stats — desktop only */}
          {stores.length > 0 && (
            <div className="mt-6 hidden lg:flex items-center gap-5">
              <Stat value={stores.length} label="Active Stores" desktopLight={!!heroBanner?.imageUrl} />
              <div className={cn("h-6 w-px bg-border", heroBanner?.imageUrl && "lg:bg-white/15")} />
              <Stat
                value={stores.reduce((sum, s) => sum + (s.productCount || 0), 0)}
                label="Products"
                desktopLight={!!heroBanner?.imageUrl}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── Advertise banner ──────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-5 sm:mt-6">
        <Link
          href="https://wa.me/2348071427831"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-[#0E5A43] text-white border border-[#0E5A43]/15 hover:border-[#0E5A43]/30 transition-all group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-[#0E5A43]/15 flex items-center justify-center flex-shrink-0">
              <FaWhatsapp className="h-4 w-4 text-[#25D366]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold truncate">Advertise your business</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Reach active shoppers on EasyLife</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#0E5A43] flex-shrink-0 transition-colors" />
        </Link>
      </div>

      {/* ── Stores grid ───────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {stores.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Store className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold mb-2">No stores yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Be the first to launch a store and start reaching customers across the marketplace.
            </p>
            <Link href="/auth/register">
              <Button className="h-11 rounded-xl bg-[#0E5A43] text-white hover:bg-[#083B2D] text-white px-6">
                Launch your store
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Section header */}
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#0E5A43]" />
                All Stores
                <span className="text-[10px] sm:text-xs text-muted-foreground font-normal">({stores.length})</span>
              </h2>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {stores.map((store) => (
                <div
                  key={store._id}
                  className="group rounded-xl border border-border/50 bg-card overflow-hidden hover:border-[#0E5A43]/30 hover:shadow-lg hover:shadow-[#0E5A43]/5 transition-all duration-300"
                >
                  <StoreCard store={store} />
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 sm:mt-10 rounded-xl border border-border/50 bg-muted/20 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#083B2D] font-semibold mb-1">Become a seller</p>
                <h3 className="text-base sm:text-lg font-semibold">Open your store on EasyLife</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Start selling to thousands of customers today.</p>
              </div>
              <Link href="/auth/register" className="flex-shrink-0">
                <Button variant="outline" className="h-10 sm:h-11 rounded-xl border-border/60 hover:border-[#0E5A43]/40 hover:bg-[#0E5A43]/5 px-5 text-sm">
                  Join now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Stat({ value, label, desktopLight }: { value: number; label: string; desktopLight: boolean }) {
  return (
    <div>
      <p className={cn("text-lg sm:text-xl font-bold text-foreground", desktopLight && "lg:text-white")}>
        {value.toLocaleString()}
      </p>
      <p className={cn("text-[10px] sm:text-xs text-muted-foreground", desktopLight && "lg:text-white/50")}>
        {label}
      </p>
    </div>
  );
}
