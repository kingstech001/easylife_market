"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Package, Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/utils";
import { isSlowNetwork } from "@/lib/network";
import { CATEGORIES, buildCategorySearchUrl } from "@/components/CategoryGrid";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id?: string;
  inventory_quantity: number;
  images: { id: string; url: string; alt_text: string | null }[];
  store_id: string;
  store_slug?: string;
  hasVariants?: boolean;
  hasModifiers?: boolean;
  created_at: string;
  updated_at: string;
};

type HeroBanner = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
};

interface AllStoreProductsClientProps {
  initialProducts: Product[];
  initialBanner: HeroBanner | null;
}

const PAGE_STEP = 12;

const hideScrollbar =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const chipClass =
  "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-background pl-3 pr-3.5 text-sm font-medium text-foreground/80 transition-colors hover:border-[#0E5A43] hover:text-[#0E5A43] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A43]/40";

export default function AllStoreProductsClient({
  initialProducts,
  initialBanner,
}: AllStoreProductsClientProps) {
  const router = useRouter();
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const visibleProducts = initialProducts.slice(0, visibleCount);

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

  // The hero image only exists on desktop, so phones shouldn't download it
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reveal more products as the sentinel scrolls into view
  useEffect(() => {
    if (visibleCount >= initialProducts.length) return;
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_STEP, initialProducts.length));
        }
      },
      { rootMargin: "300px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [initialProducts.length, visibleCount]);

  const categoryPreview = useMemo(() => CATEGORIES.slice(0, 8), []);

  const showBanner = isDesktop && !isSlowConnection && !!initialBanner?.imageUrl;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/Search?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background lg:bg-[#083B2D]">
        <div className="absolute inset-0 hidden lg:block">
          {showBanner ? (
            <>
              <Image
                key={initialBanner!.id}
                src={initialBanner!.imageUrl}
                alt={initialBanner!.title || "Hero banner"}
                fill
                priority
                sizes="100vw"
                onLoad={() => setBannerLoaded(true)}
                className={cn(
                  "object-cover transition-opacity duration-700",
                  bannerLoaded ? "opacity-100" : "opacity-0",
                )}
              />
              <div className="absolute inset-0 bg-black/60" />
            </>
          ) : (
            <div
              className="absolute inset-0 opacity-[0.1]"
              style={{
                backgroundImage: "url('/pattern.svg')",
                backgroundRepeat: "repeat",
                backgroundSize: "480px 480px",
              }}
            />
          )}
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <div className="hidden lg:block">
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.15] tracking-tight text-white">
                {initialBanner?.title || "Discover quality products"}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-7 text-white/80">
                {initialBanner?.subtitle ||
                  "Browse products from trusted sellers, food spots, and growing local businesses in one place."}
              </p>
            </div>

            <form onSubmit={handleSearch} role="search" className="max-w-2xl lg:mt-8">
              <div
                className={cn(
                  "flex h-12 items-center overflow-hidden rounded-xl border border-border bg-background transition-shadow",
                  "focus-within:border-[#0E5A43] focus-within:ring-4 focus-within:ring-[#0E5A43]/10",
                  "lg:h-14 lg:border-transparent lg:bg-white lg:shadow-xl lg:focus-within:border-transparent lg:focus-within:ring-[#F4C430]/40",
                )}
              >
                <Search className="ml-4 h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, food, gadgets, fashion..."
                  aria-label="Search products"
                  className="h-full flex-1 bg-transparent px-3 text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm lg:text-slate-900 lg:placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="flex h-full items-center gap-2 bg-[#0E5A43] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#083B2D] sm:px-6"
                >
                  <span className="hidden sm:inline">Search</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="browse-categories"
        className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"
      >
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="browse-categories" className="text-base font-semibold">
            Browse categories
          </h2>
          <Link
            href="/Search"
            className="text-sm font-medium text-[#0E5A43] underline-offset-4 hover:underline dark:text-emerald-400"
          >
            View all
          </Link>
        </div>

        <ul
          className={`-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 ${hideScrollbar}`}
        >
          {categoryPreview.map((category) => {
            const Icon = category.icon;
            return (
              <li key={category.name} className="shrink-0">
                <Link href={buildCategorySearchUrl(category)} className={chipClass}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Products ──────────────────────────────────────────────────────── */}
      <section
        id="products"
        aria-labelledby="products-heading"
        className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-16"
      >
        {initialProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 id="products-heading" className="text-lg font-semibold text-foreground">
              No products yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              There are no products available right now. Check back soon for new
              arrivals from stores and restaurants.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-end justify-between gap-3">
              <div>
                <h2
                  id="products-heading"
                  className="text-xl font-semibold tracking-tight sm:text-2xl"
                >
                  {isSlowConnection ? "Quick picks" : "Latest products"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {initialProducts.length}{" "}
                  {initialProducts.length === 1 ? "product" : "products"} from
                  trusted stores
                </p>
              </div>
              {isSlowConnection && (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  Slow network
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4 xl:grid-cols-5">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeSlug={product.store_slug || ""}
                />
              ))}
            </div>

            <div ref={sentinelRef} className="h-2 w-full" />

            {visibleCount < initialProducts.length && (
              <div
                className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"
                role="status"
              >
                <Loader2 className="h-4 w-4 animate-spin text-[#0E5A43]" />
                Loading more products
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
} 