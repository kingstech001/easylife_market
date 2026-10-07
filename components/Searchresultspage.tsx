"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Package,
  Loader2,
  X,
  Store,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { CATEGORIES, buildCategorySearchUrl } from "@/components/CategoryGrid";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category?: string;
  inventory_quantity: number;
  images: { id: string; url: string; alt_text: string | null }[];
  store_id: string;
  store_slug?: string;
  created_at: string;
  updated_at: string;
  hasVariants?: boolean;
  hasModifiers?: boolean;
};

type StoreResult = {
  _id: string;
  businessName: string;
  description?: string;
  location?: string;
  logo?: string;
  slug?: string;
};

interface SearchResultsClientProps {
  query: string;
  categories: string[];
  initialProducts: Product[];
  initialHasMore: boolean;
  failed?: boolean;
}

const hideScrollbar =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton (Suspense fallback in page.tsx)
// ─────────────────────────────────────────────────────────────────────────────

export function SearchResultsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading results"
      className="space-y-6 px-4 pb-10 pt-5 sm:px-6 lg:px-0"
    >
      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square animate-pulse rounded-xl bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────

export function SearchResultsClient({
  query,
  categories,
  initialProducts,
  initialHasMore,
  failed = false,
}: SearchResultsClientProps) {
  const router = useRouter();

  // The first page arrives already filtered from the server.
  // (page.tsx re-keys this tree whenever the search changes, so state resets for free.)
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [inView, setInView] = useState(false);

  const [storeResults, setStoreResults] = useState<StoreResult[]>([]);
  const [storesLoaded, setStoresLoaded] = useState(!query);

  const observerTarget = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);

  // Stores load separately, so they never delay the products
  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const data = await response.json();
        setStoreResults(data.stores || []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Search API error:", err);
        }
      } finally {
        if (!controller.signal.aborted) setStoresLoaded(true);
      }
    })();
    return () => controller.abort();
  }, [query]);

  // ── Infinite scroll (next pages come pre-filtered from the server) ─────────
  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMore) return;
    fetchingRef.current = true;
    setLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      categories.forEach((c) => params.append("category", c));
      params.set("page", String(page + 1));

      const res = await fetch(`/api/search-products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load more products");
      const data: { products: Product[]; hasMore: boolean } = await res.json();

      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...data.products.filter((p) => !seen.has(p.id))];
      });
      setPage((p) => p + 1);
      setHasMore(!!data.hasMore);
    } catch {
      // Keep what's already on screen; just stop paging
      setHasMore(false);
    } finally {
      fetchingRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, page, query, categories]);

  useEffect(() => {
    const el = observerTarget.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView && hasMore && !loadingMore) loadMore();
  }, [inView, hasMore, loadingMore, loadMore]);

  // ── Derived display values ─────────────────────────────────────────────────
  const activeCategory = CATEGORIES.find(
    (c) => c.name.toLowerCase() === categories[0]?.toLowerCase(),
  );
  const hasFilter = !!query || categories.length > 0;
  const hasStores = storeResults.length > 0;
  const hasProducts = products.length > 0;

  const heading = query
    ? `Results for “${query}”`
    : activeCategory
      ? activeCategory.name
      : categories[0]
        ? titleCase(categories[0])
        : "All products";

  const productCount = `${products.length}${hasMore ? "+" : ""} product${
    products.length === 1 && !hasMore ? "" : "s"
  }`;

  // ── Error ──────────────────────────────────────────────────────────────────
  if (failed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Couldn’t load products</h3>
            <p className="text-sm text-muted-foreground">
              Something went wrong on our side. Please try again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="h-11 w-full rounded-xl bg-[#0E5A43] text-sm font-semibold text-white transition-colors hover:bg-[#083B2D]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 px-4 pb-10 pt-5 sm:px-6 lg:px-0">
      {/* Heading */}
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {productCount}
            {hasStores && (
              <>
                {" · "}
                {storeResults.length} store
                {storeResults.length === 1 ? "" : "s"}
              </>
            )}
          </p>
        </div>
        {hasFilter && (
          <Link
            href="/Search"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:border-[#0E5A43] hover:text-[#0E5A43]"
          >
            <X className="h-3 w-3" />
            Clear
          </Link>
        )}
      </header>

      {/* Stores */}
      {hasStores && (
        <section aria-labelledby="stores-heading">
          <h2
            id="stores-heading"
            className="mb-3 text-base font-semibold text-foreground"
          >
            Stores
          </h2>
          <div
            className={`-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3 ${hideScrollbar}`}
          >
            {storeResults.map((store) => (
              <Link
                key={store._id}
                href={`/stores/${store.slug || store._id}`}
                className="group flex w-[260px] shrink-0 items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-[#0E5A43]/50 sm:w-auto sm:shrink"
              >
                {store.logo ? (
                  <img
                    src={store.logo}
                    alt={store.businessName}
                    className="h-11 w-11 shrink-0 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Store className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-[#0E5A43] dark:group-hover:text-emerald-400">
                    {store.businessName}
                  </p>
                  {(store.description || store.location) && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      {!store.description && store.location && (
                        <MapPin className="h-3 w-3 shrink-0" />
                      )}
                      <span className="truncate">
                        {store.description || store.location}
                      </span>
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-[#0E5A43]" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      {hasProducts && (
        <section aria-labelledby="products-heading">
          {hasStores && (
            <h2
              id="products-heading"
              className="mb-3 text-base font-semibold text-foreground"
            >
              Products
            </h2>
          )}
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeSlug={product.store_slug || ""}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state (waits for stores, so it doesn't flash before they arrive) */}
      {!hasProducts && !hasStores && !hasMore && storesLoaded && (
        <div className="mx-auto max-w-sm py-16 text-center sm:py-24">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Nothing found</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            {hasFilter ? (
              <>
                We couldn’t find anything for{" "}
                <span className="font-medium text-foreground">
                  “{query || activeCategory?.name || categories[0]}”
                </span>
                . Check the spelling or try a broader term.
              </>
            ) : (
              "There are no products to show right now."
            )}
          </p>

          <p className="mb-3 text-xs font-medium text-muted-foreground">
            Or browse a category
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.slice(0, 6).map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  href={buildCategorySearchUrl(cat)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background pl-3 pr-3.5 text-sm font-medium text-foreground/80 transition-colors hover:border-[#0E5A43] hover:text-[#0E5A43]"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Infinite-scroll sentinel */}
      <div
        ref={observerTarget}
        className="flex min-h-10 items-center justify-center"
      >
        {loadingMore ? (
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-[#0E5A43]" />
            Loading more
          </span>
        ) : !hasMore && products.length > 24 ? (
          <span className="text-xs text-muted-foreground">
            You’ve reached the end
          </span>
        ) : null}
      </div>
    </div>
  );
}