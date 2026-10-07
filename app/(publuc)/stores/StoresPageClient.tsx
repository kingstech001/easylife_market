"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, Loader2, Search, Store, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { StoreCard } from "@/components/store-card";
import { cn } from "@/lib/utils";
import { isSlowNetwork } from "@/lib/network";

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
  businessHours?: BusinessHours | null;
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
  totalProducts: number;
}

const HERO_ROTATION_MS = 60000;
const HERO_SWAP_DELAY_MS = 100;
const PAGE_STEP = 6;

// Matches the grid below: 1 column on phones, 2 on tablets, 3 on desktop
const CARD_IMAGE_SIZES =
  "(min-width: 1024px) 330px, (min-width: 640px) 45vw, 100vw";

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function StoresPageClient({
  initialStores,
  totalProducts,
}: StoresPageClientProps) {
  const router = useRouter();
  const stores = initialStores;

  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP);
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const visibleStores = stores.slice(0, visibleCount);
  const hasBanner = !!heroBanner?.imageUrl;

  // Connection quality
  useEffect(() => {
    const update = () => setIsSlowConnection(isSlowNetwork());
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // The hero image is desktop-only, so phones shouldn't fetch or preload it
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Hero banner: desktop + decent connection only
  useEffect(() => {
    if (!isDesktop || isSlowConnection) return;

    let cancelled = false;
    let swapTimer: number | undefined;

    const loadBanner = async (rotating: boolean) => {
      try {
        if (rotating) setIsTransitioning(true);
        const res = await fetch("/api/hero-banner", {
          signal: AbortSignal.timeout(10000),
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.banner && !cancelled) {
            swapTimer = window.setTimeout(() => {
              if (cancelled) return;
              setHeroBanner(data.banner);
              setIsTransitioning(false);
            }, HERO_SWAP_DELAY_MS);
            return;
          }
        }
      } catch {
        // ignore: the hero simply stays as it is
      }
      if (!cancelled) setIsTransitioning(false);
    };

    // Let the stores paint first
    const first = window.setTimeout(() => loadBanner(false), 250);
    const interval = window.setInterval(() => loadBanner(true), HERO_ROTATION_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(interval);
      if (swapTimer) window.clearTimeout(swapTimer);
    };
  }, [isDesktop, isSlowConnection]);

  // Reveal more stores as the sentinel scrolls into view
  useEffect(() => {
    if (visibleCount >= stores.length) return;
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_STEP, stores.length));
        }
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [stores.length, visibleCount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/Search?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {hasBanner ? (
            <>
              <div
                className={cn(
                  "absolute inset-0 hidden transition-opacity duration-700 lg:block",
                  isTransitioning ? "opacity-0" : "opacity-100",
                )}
              >
                <Image
                  key={heroBanner!.id}
                  src={heroBanner!.imageUrl}
                  alt={heroBanner!.title || "Stores"}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 hidden bg-black/60 lg:block" />
              <div className="absolute inset-0 bg-background lg:hidden" />
            </>
          ) : (
            <div className="absolute inset-0 bg-background lg:bg-[#0E5A43]/10" />
          )}
        </div>

        <div className="relative mx-auto max-w-5xl px-4 pb-4 pt-4 sm:px-6 lg:pb-16 lg:pt-20">
          {/* Heading: desktop only */}
          <div className="hidden max-w-2xl lg:block">
            <h1
              className={cn(
                "text-5xl font-bold leading-[1.15] tracking-tight",
                hasBanner ? "text-white" : "text-foreground",
              )}
            >
              {heroBanner?.title || "Explore stores across the marketplace"}
            </h1>
            <p
              className={cn(
                "mt-4 max-w-xl text-lg leading-relaxed",
                hasBanner ? "text-white/75" : "text-muted-foreground",
              )}
            >
              {heroBanner?.subtitle ||
                "Browse growing brands, local vendors, and premium sellers in one place."}
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} role="search" className="max-w-lg lg:mt-8">
            <div
              className={cn(
                "flex h-12 items-center overflow-hidden rounded-xl border transition-colors",
                "border-border bg-muted/50 focus-within:border-[#0E5A43] focus-within:bg-background focus-within:ring-4 focus-within:ring-[#0E5A43]/10",
                hasBanner &&
                  "lg:border-white/20 lg:bg-white/10 lg:backdrop-blur-md lg:focus-within:bg-white/15 lg:focus-within:ring-white/10",
              )}
            >
              <Search
                className={cn(
                  "ml-3.5 h-4 w-4 shrink-0 text-muted-foreground",
                  hasBanner && "lg:text-white/60",
                )}
              />
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stores, products..."
                aria-label="Search stores and products"
                className={cn(
                  "h-full flex-1 bg-transparent px-3 text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm",
                  hasBanner && "lg:text-white lg:placeholder:text-white/50",
                )}
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery("")}
                  className="mr-1 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted lg:hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="flex h-full items-center gap-1.5 bg-[#0E5A43] px-4 text-sm font-medium text-white transition-colors hover:bg-[#083B2D] sm:px-5"
              >
                <span className="hidden sm:inline">Search</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Stats: desktop only */}
          {stores.length > 0 && (
            <dl className="mt-6 hidden items-center gap-6 lg:flex">
              <Stat value={stores.length} label="Active stores" light={hasBanner} />
              <span
                aria-hidden
                className={cn("h-6 w-px bg-border", hasBanner && "bg-white/20")}
              />
              <Stat value={totalProducts} label="Products" light={hasBanner} />
            </dl>
          )}
        </div>
      </section>

      {/* ── Advertise banner ──────────────────────────────────────────────── */}
      <div className="mx-auto mt-5 max-w-5xl px-4 sm:mt-6 sm:px-6">
        <Link
          href="https://wa.me/2348071427831"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between gap-4 rounded-xl bg-[#0E5A43] px-4 py-3 text-white transition-colors hover:bg-[#0b4d3a] sm:px-5 sm:py-3.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <FaWhatsapp className="h-[18px] w-[18px] text-[#25D366]" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                Advertise your business
              </p>
              <p className="truncate text-xs text-white/70">
                Reach active shoppers on EasyLife
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* ── Stores grid ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {stores.length === 0 ? (
          <div className="py-16 text-center sm:py-24">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Store className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">No stores yet</h2>
            <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
              Be the first to launch a store and start reaching customers across
              the marketplace.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex h-11 items-center rounded-xl bg-[#0E5A43] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#083B2D]"
            >
              Launch your store
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {isSlowConnection ? "Quick picks" : "Stores"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stores.length} {stores.length === 1 ? "store" : "stores"} on EasyLife
                </p>
              </div>
              {isSlowConnection && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  Slow network
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {visibleStores.map((store, i) => (
                <StoreCard
                  key={store._id}
                  store={store}
                  variant="compact"
                  priority={i < 3}
                  sizes={CARD_IMAGE_SIZES}
                />
              ))}
            </div>

            <div ref={sentinelRef} className="h-2 w-full" />

            {visibleCount < stores.length && (
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-[#0E5A43]" />
                Loading more stores
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Stat({
  value,
  label,
  light,
}: {
  value: number;
  label: string;
  light: boolean;
}) {
  return (
    <div>
      <dd
        className={cn(
          "text-xl font-bold tabular-nums text-foreground",
          light && "text-white",
        )}
      >
        {value.toLocaleString()}
      </dd>
      <dt
        className={cn(
          "text-xs text-muted-foreground",
          light && "text-white/60",
        )}
      >
        {label}
      </dt>
    </div>
  );
}