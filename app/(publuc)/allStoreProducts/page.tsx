"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Package, Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Define Product type (matches ProductCard interface)
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

// Type for API response (with storeId)
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
  storeId?:
    | string
    | {
        _id: string;
        name: string;
        slug: string;
      };
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Function to fetch a new banner
  const fetchNewBanner = async () => {
    try {
      console.log("🔄 Fetching new banner...");
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
            console.log("✅ New banner loaded:", bannerData.source);
          }, 50);
        }
      }
    } catch (err) {
      console.log("⚠️ Banner fetch failed");
      setIsTransitioning(false);
    }
  };

  // Initial banner fetch
  useEffect(() => {
    fetchNewBanner();
  }, []);

  // Set up interval to change banner every minute
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("⏰ 1 minute passed, fetching new banner...");
      fetchNewBanner();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);

        const productsRes = await fetch("/api/allStoreProducts");

        if (!productsRes.ok) {
          throw new Error("Failed to fetch products");
        }

        const productsData = await productsRes.json();

        // Transform API products to match ProductCard interface
        const transformedProducts: Product[] = (
          productsData.products || []
        ).map((p: ApiProduct) => {
          // Handle images
          let productImages = p.images || [];
          if (productImages.length === 0 && p.primaryImage) {
            productImages = [
              {
                id: "1",
                _id: "1",
                url: p.primaryImage,
                alt_text: null,
                altText: null,
              },
            ];
          }

          // Extract store information
          const storeId =
            typeof p.storeId === "string" ? p.storeId : p.storeId?._id || "";
          const storeSlug =
            typeof p.storeId === "object" && p.storeId?.slug
              ? p.storeId.slug
              : "";

          if (!storeSlug) {
            console.warn("⚠️ Product missing store slug:", p.name, p._id);
          }

          return {
            id: p._id,
            name: p.name,
            description: p.description || null,
            price: p.price,
            compare_at_price: p.compareAtPrice || p.compare_at_price || null,
            inventory_quantity:
              p.inventoryQuantity ?? p.inventory_quantity ?? 0,
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
        });

        console.log("✅ Transformed products:", transformedProducts.length);

        setProducts(transformedProducts);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Handle search
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
            <div className="w-20 h-20 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto"></div>
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
      {/* Hero Section with Dynamic Banner */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden">
        {heroBanner?.imageUrl ? (
          <>
            {/* Background Image with transition */}
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
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30" />

            {/* Content */}
            <div className="relative container mx-auto px-4 h-full flex flex-col items-center justify-center">
              <div className="max-w-3xl text-center space-y-6">
                <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-3 tracking-tight drop-shadow-lg text-white">
                  {heroBanner.title || "Discover Quality Products"}
                </h1>
                <p className="text-lg md:text-xl mb-6 text-white/90 drop-shadow-md">
                  {heroBanner.subtitle ||
                    "Browse our curated collection from trusted sellers"}
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

            {/* Banner Change Indicator */}
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
          // Fallback gradient design
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#e1a200]/30 via-[#e1a200]/10 to-primary/5">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-[#e1a200] rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary rounded-full blur-3xl animate-pulse" />
              </div>
            </div>

            <div className="relative container mx-auto px-4 h-full flex flex-col items-center justify-center">
              <div className="max-w-3xl text-center space-y-6">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">
                  Discover Quality Products
                </h1>
                <p className="text-lg text-muted-foreground">
                  Browse our curated collection from trusted sellers
                </p>

                {/* Search Bar - Fallback */}
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 lg:px-8" id="products">
        <div className="flex gap-6">
          {/* Sidebar - Filters & Ads */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-8 space-y-6">
              {/* Ad Space 1 */}
              <div className="border-0 shadow-sm rounded-2xl p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
                <div className="text-xs font-bold mb-1 text-orange-700 dark:text-orange-300 uppercase tracking-wide">
                  SPECIAL OFFER
                </div>
                <h3 className="text-xl font-bold mb-2 text-orange-900 dark:text-orange-100">
                  Up to 50% Off
                </h3>
                <p className="text-sm mb-4 text-orange-700 dark:text-orange-300">
                  Selected items this week only
                </p>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition shadow-lg w-full">
                  Shop Now
                </button>
              </div>

              {/* Ad Space 2 */}
              <div className="border-0 shadow-sm rounded-2xl p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
                <div className="text-xs font-bold mb-1 text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  NEW ARRIVAL
                </div>
                <h3 className="text-xl font-bold mb-2 text-purple-900 dark:text-purple-100">
                  Latest Collection
                </h3>
                <p className="text-sm mb-4 text-purple-700 dark:text-purple-300">
                  Discover trending products
                </p>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition shadow-lg w-full">
                  Explore
                </button>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1 min-w-0">
            {/* Products */}
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
                <div className="grid gap-6 grid-cols-2 sm:grid-cols-auto-fill">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      storeSlug={product.store_slug || ""}
                    />
                  ))}
                </div>

                {/* Bottom Ad Space */}
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
          </main>
        </div>
      </div>
    </div>
  );
}