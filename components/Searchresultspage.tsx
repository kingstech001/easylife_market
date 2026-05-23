"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search, Package, Loader2, X, Store, ArrowLeft, SlidersHorizontal,
  ChevronRight, MapPin, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORIES, CategoryGrid, buildCategorySearchUrl } from "@/components/CategoryGrid";

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
  category_id?: string;
  inventory_quantity: number;
  images: { id: string; url: string; alt_text: string | null }[];
  store_id: string;
  store_slug?: string;
  created_at: string;
  updated_at: string;
  hasVariants?: boolean;
  variants?: any;
};

type ApiProduct = {
  _id: string;
  name: string;
  description?: string | null;
  price: number;
  category?: string;
  compareAtPrice?: number | null;
  compare_at_price?: number | null;
  primaryImage?: string;
  images?: { id?: string; _id?: string; url: string; alt_text?: string | null; altText?: string | null }[];
  inventoryQuantity?: number;
  inventory_quantity?: number;
  hasVariants?: boolean;
  variants?: any;
  storeId?: string | { _id: string; name: string; slug: string };
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

type StoreResult = {
  _id: string;
  businessName: string;
  description?: string;
  location?: string;
  logo?: string;
  slug?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCTS_PER_PAGE = 12;

function expandCategories(categoryNames: string[]): string[] {
  const expandedCategories = new Set<string>();
  categoryNames.forEach((catName) => {
    const categoryLower = catName.toLowerCase().trim();
    expandedCategories.add(categoryLower);
    const matchedCategory = CATEGORIES.find(
      (cat) => cat.name.toLowerCase() === categoryLower
    );
    if (matchedCategory) {
      matchedCategory.subcategories.forEach((sub) => {
        expandedCategories.add(sub.toLowerCase());
      });
    }
  });
  return Array.from(expandedCategories);
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || searchParams.get("q") || "";
  const categoryParams = useMemo(() => searchParams.getAll("category"), [searchParams]);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [storeResults, setStoreResults] = useState<StoreResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [searchFocused, setSearchFocused] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const transformProduct = useCallback((p: ApiProduct): Product => {
    let productImages = p.images || [];
    if (productImages.length === 0 && p.primaryImage) {
      productImages = [{ id: "1", _id: "1", url: p.primaryImage, alt_text: null, altText: null }];
    }
    const storeId = typeof p.storeId === "string" ? p.storeId : p.storeId?._id || "";
    const storeSlug = typeof p.storeId === "object" && p.storeId?.slug ? p.storeId.slug : "";
    return {
      id: p._id,
      name: p.name,
      description: p.description || null,
      price: p.price,
      category: p.category,
      compare_at_price: p.compareAtPrice || p.compare_at_price || null,
      inventory_quantity: p.inventoryQuantity ?? p.inventory_quantity ?? 0,
      images: productImages.map((img: any) => ({
        id: img.id || img._id?.toString() || "",
        url: img.url || "",
        alt_text: img.alt_text || img.altText || null,
      })),
      store_id: storeId,
      store_slug: storeSlug,
      created_at: p.createdAt || p.created_at || new Date().toISOString(),
      updated_at: p.updatedAt || p.updated_at || new Date().toISOString(),
      hasVariants: p.hasVariants,
      variants: p.variants,
    };
  }, []);

  // Fetch all products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await fetch("/api/allStoreProducts");
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setAllProducts((data.products || []).map(transformProduct));
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [transformProduct]);

  // Fetch store results for search query
  useEffect(() => {
    if (!searchQuery.trim()) { setStoreResults([]); return; }
    async function fetchSearchResults() {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) return;
        const data = await response.json();
        setStoreResults(data.stores || []);
      } catch (err) {
        console.error("Search API error:", err);
      }
    }
    fetchSearchResults();
  }, [searchQuery]);

  // Filter products
  useEffect(() => {
    if (allProducts.length === 0) {
      setFilteredProducts([]); setDisplayedProducts([]); return;
    }
    const searchTerm = searchQuery.toLowerCase().trim();
    const expandedCategories = expandCategories(categoryParams);
    if (!searchTerm && expandedCategories.length === 0) {
      setFilteredProducts(allProducts);
      setDisplayedProducts(allProducts.slice(0, PRODUCTS_PER_PAGE));
      setHasMore(allProducts.length > PRODUCTS_PER_PAGE);
      setPage(1);
      return;
    }
    const filtered = allProducts.filter((product) => {
      const productName = product.name.toLowerCase();
      const productDesc = (product.description || "").toLowerCase();
      const productCategory = (product.category || "").toLowerCase();
      if (searchTerm) {
        if (!productName.includes(searchTerm) && !productDesc.includes(searchTerm) && !productCategory.includes(searchTerm)) return false;
      }
      if (expandedCategories.length > 0) {
        const categoryMatches = expandedCategories.some(
          (cat) => productCategory.includes(cat) || productName.includes(cat) || productDesc.includes(cat)
        );
        if (!categoryMatches) return false;
      }
      return true;
    });
    setFilteredProducts(filtered);
    setDisplayedProducts(filtered.slice(0, PRODUCTS_PER_PAGE));
    setHasMore(filtered.length > PRODUCTS_PER_PAGE);
    setPage(1);
  }, [searchQuery, categoryParams, allProducts]);

  // Infinite scroll
  const loadMoreProducts = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      const startIndex = page * PRODUCTS_PER_PAGE;
      const endIndex = startIndex + PRODUCTS_PER_PAGE;
      const newProducts = filteredProducts.slice(startIndex, endIndex);
      if (newProducts.length > 0) {
        setDisplayedProducts((prev) => [...prev, ...newProducts]);
        setPage((prev) => prev + 1);
        setHasMore(endIndex < filteredProducts.length);
      } else {
        setHasMore(false);
      }
      setLoadingMore(false);
    }, 300);
  }, [page, filteredProducts, hasMore, loadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !loadingMore) loadMoreProducts(); },
      { threshold: 0.1, rootMargin: "100px" }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [hasMore, loadingMore, loadMoreProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      window.location.href = `/Search?search=${encodeURIComponent(localSearchQuery.trim())}`;
    }
  };

  const clearSearch = () => { window.location.href = "/Search"; };

  const currentQuery = searchQuery || (categoryParams.length > 0 ? categoryParams[0] : "");
  const hasStores = storeResults.length > 0;
  const hasProducts = displayedProducts.length > 0;
  const totalResults = filteredProducts.length + storeResults.length;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative w-14 h-14 mx-auto">
            <div className="w-14 h-14 border-[3px] border-muted border-t-[#e1a200] rounded-full animate-spin" />
            <Search className="absolute inset-0 m-auto w-5 h-5 text-[#e1a200]" />
          </div>
          <div>
            <p className="text-sm font-medium">Searching...</p>
            <p className="text-xs text-muted-foreground mt-0.5">Finding the best matches</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Package className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} className="rounded-xl h-11 w-full">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-background">
      {/* ── Sticky search bar ─────────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search products, stores, categories..."
              className={cn(
                "w-full h-11 pl-10 pr-20 rounded-xl bg-muted/50 border text-sm outline-none transition-all",
                searchFocused
                  ? "border-[#e1a200] ring-2 ring-[#e1a200]/15 bg-background"
                  : "border-border/50 hover:border-border"
              )}
            />
            {localSearchQuery && (
              <button
                type="button"
                onClick={() => { setLocalSearchQuery(""); searchInputRef.current?.focus(); }}
                className="absolute right-[4.5rem] top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3.5 rounded-lg bg-[#e1a200] hover:bg-[#c89200] text-white text-xs font-medium shadow-sm"
            >
              Search
            </Button>
          </form>

          {/* Category scroll */}
          <div className="mt-2.5">
            <CategoryGrid />
          </div>

          {/* Active filters */}
          {currentQuery && (
            <div className="flex items-center gap-2 mt-2.5 sm:mt-3">
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {totalResults} result{totalResults !== 1 ? "s" : ""}
              </span>
              <div className="h-3 w-px bg-border" />
              <button
                onClick={clearSearch}
                className="inline-flex items-center gap-1.5 text-xs bg-[#e1a200]/10 text-[#c89200] dark:text-[#e1a200] px-2.5 py-1 rounded-full hover:bg-[#e1a200]/20 transition-colors font-medium"
              >
                {currentQuery}
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">

        {/* ── Stores ── */}
        {hasStores && (
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <Store className="h-4 w-4 text-[#e1a200]" />
                Stores
                <span className="text-[10px] sm:text-xs text-muted-foreground font-normal">({storeResults.length})</span>
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-3">
              {storeResults.map((store) => (
                <Link
                  key={store._id}
                  href={`/stores/${store.slug || store._id}`}
                  className="flex-shrink-0 w-[260px] sm:w-auto flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border border-border/50 hover:border-[#e1a200]/40 bg-card hover:bg-[#e1a200]/[0.03] transition-all group active:scale-[0.98]"
                >
                  {store.logo ? (
                    <img
                      src={store.logo}
                      alt={store.businessName}
                      className="h-11 w-11 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0 border border-border/50"
                    />
                  ) : (
                    <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-lg bg-[#e1a200]/10 flex items-center justify-center flex-shrink-0">
                      <Store className="h-5 w-5 text-[#e1a200]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-[#e1a200] transition-colors">
                      {store.businessName}
                    </p>
                    {(store.description || store.location) && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                        {store.location && <MapPin className="h-2.5 w-2.5 flex-shrink-0" />}
                        {store.description || store.location}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-[#e1a200] flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Products ── */}
        {hasProducts ? (
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-[#e1a200]" />
                Products
                <span className="text-[10px] sm:text-xs text-muted-foreground font-normal">({filteredProducts.length})</span>
              </h2>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeSlug={product.store_slug || ""}
                />
              ))}
            </div>

            {/* Infinite scroll target */}
            <div ref={observerTarget} className="py-6">
              {loadingMore && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#e1a200]" />
                  <span className="text-xs text-muted-foreground">Loading more...</span>
                </div>
              )}
              {!hasMore && displayedProducts.length > 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  All {displayedProducts.length} products loaded
                </p>
              )}
            </div>
          </section>
        ) : (
          !hasStores && (
            <div className="max-w-sm mx-auto text-center py-16 sm:py-24">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Search className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground mb-6 px-4">
                {currentQuery
                  ? <>We couldn&apos;t find anything matching <span className="font-medium text-foreground">&quot;{currentQuery}&quot;</span></>
                  : "Try searching for a product, store, or category"}
              </p>

              {/* Suggested categories */}
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Try a category</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {CATEGORIES.slice(0, 6).map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <Link
                        key={cat.name}
                        href={buildCategorySearchUrl(cat)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border/50 hover:border-[#e1a200]/40 hover:bg-[#e1a200]/5 transition-all"
                      >
                        <Icon className="h-3 w-3 text-[#e1a200]" />
                        {cat.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
