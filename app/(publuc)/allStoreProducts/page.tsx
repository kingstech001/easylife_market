"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { CATEGORIES, buildCategorySearchUrl } from "@/components/CategoryGrid";

// ─── Types ────────────────────────────────────────────────────────────────────
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

type ApiProduct = {
  _id: string;
  name: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  compare_at_price?: number | null;
  primaryImage?: string;
  images?: {
    id?: string;
    _id?: string;
    url: string;
    alt_text?: string | null;
    altText?: string | null;
  }[];
  inventoryQuantity?: number;
  inventory_quantity?: number;
  storeId?: string | { _id: string; name: string; slug: string };
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Banner fetch
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
          }, 50);
        }
      }
    } catch {
      setIsTransitioning(false);
    }
  };

  useEffect(() => { fetchNewBanner(); }, []);
  useEffect(() => {
    const interval = setInterval(fetchNewBanner, 60000);
    return () => clearInterval(interval);
  }, []);

  // Products fetch
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const productsRes = await fetch("/api/allStoreProducts");
        if (!productsRes.ok) throw new Error("Failed to fetch products");
        const productsData = await productsRes.json();

        const transformedProducts: Product[] = (productsData.products || []).map(
          (p: ApiProduct) => {
            let productImages = p.images || [];
            if (productImages.length === 0 && p.primaryImage) {
              productImages = [{
                id: "1", _id: "1", url: p.primaryImage,
                alt_text: null, altText: null,
              }];
            }
            const storeId =
              typeof p.storeId === "string" ? p.storeId : p.storeId?._id || "";
            const storeSlug =
              typeof p.storeId === "object" && p.storeId?.slug
                ? p.storeId.slug
                : "";
            return {
              id: p._id,
              name: p.name,
              description: p.description || null,
              price: p.price,
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
            };
          }
        );

        setProducts(transformedProducts);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/Search?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Loading products...</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we fetch the latest products
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <Package className="h-16 w-16 text-destructive mx-auto" />
          <h3 className="text-xl font-semibold">Error Loading Products</h3>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">

      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <div className="relative h-64 w-full overflow-hidden">
        {heroBanner?.imageUrl ? (
          <>
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              <Image
                key={heroBanner.id}
                src={heroBanner.imageUrl}
                alt={heroBanner.title || "Hero Banner"}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30" />
            <div className="relative container mx-auto px-4 h-full flex flex-col items-center justify-center">
              <div className="max-w-3xl text-center space-y-6">
                <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-tight drop-shadow-lg text-white">
                  {heroBanner.title || "Discover Quality Products"}
                </h1>
                <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
                  {heroBanner.subtitle || "Browse our curated collection from trusted sellers"}
                </p>
               {/* Search Bar */}
                <div className="max-w-2xl mx-auto">
                  <form onSubmit={handleSearch} className="relative">
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for products..."
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
              </div>
            </div>
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
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#e1a200]/30 via-[#e1a200]/10 to-primary/5">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-[#e1a200] rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary rounded-full blur-3xl animate-pulse" />
              </div>
            </div>
            <div className="relative container mx-auto px-4 h-full flex flex-col items-center justify-center">
              <div className="max-w-3xl text-center space-y-6">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                  Discover Quality Products
                </h1>
                <p className="text-lg text-muted-foreground">
                  Browse our curated collection from trusted sellers
                </p>
                <div className="max-w-2xl mx-auto">
                  <form onSubmit={handleSearch} className="relative">
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for products..."
                      className={cn(
                        "h-14 pl-5 pr-29 text-[13px] rounded-full shadow-lg",
                        "border-0 border-transparent outline-none ring-0 ring-offset-0",
                        "focus:border-0 focus:outline-none focus:ring-0 focus-visible:ring-0",
                        "bg-white/10 backdrop-blur-sm",
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
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Category Grid — all screen sizes ─────────────────────────────── */}
      <div className="container mx-auto px-4 lg:px-8 pt-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 md:text-center">
          Browse Products by Category
        </p>
        {/* Scrollable on mobile, wrapping on desktop */}
        <div className="flex gap-3 overflow-x-auto pb-2 lg:overflow-visible lg:flex-wrap scrollbar-hide md:justify-center">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.name}
                href={buildCategorySearchUrl(category)}
                className="group flex-shrink-0 lg:flex-shrink"
              >
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/30 border border-border hover:border-[#e1a200]/50 hover:bg-[#e1a200]/5 hover:shadow-md transition-all duration-300 w-[72px] lg:w-[80px] mb-2">
                  <div className="p-2.5 rounded-full bg-background border border-border group-hover:border-[#e1a200]/40 group-hover:bg-[#e1a200]/10 group-hover:scale-110 transition-all duration-300">
                    <Icon className="h-4 w-4 lg:h-5 lg:w-5 text-[#e1a200]" />
                  </div>
                </div>
                  <span className="text-[9px] lg:text-[10px] font-semibold text-foreground text-center leading-tight line-clamp-2">
                    {category.name}
                  </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Products ──────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-6 lg:px-8" id="products">
        {products.length === 0 ? (
          <div className="border-2 border-dashed rounded-2xl shadow-sm p-12 text-center bg-card">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Package className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adding some products to your stores or check back later
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeSlug={product.store_slug || ""}
                />
              ))}
            </div>

            {/* Newsletter */}
            <div className="mt-8 border-0 shadow-lg rounded-2xl p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 text-center">
              <h3 className="text-2xl font-bold mb-2 text-green-900 dark:text-green-100">
                Join Our Newsletter
              </h3>
              <p className="mb-4 text-green-700 dark:text-green-300">
                Get exclusive deals and updates delivered to your inbox
              </p>
              <div className="max-w-md mx-auto flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 pl-2 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                />
                <button className="bg-primary text-primary-foreground px-2 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg">
                  Subscribe
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}