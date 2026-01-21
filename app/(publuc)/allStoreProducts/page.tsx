"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { ProductCard } from "@/components/product-card";

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
  images?: { id?: string; _id?: string; url: string; alt_text?: string | null; altText?: string | null }[];
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
  const [products, setProducts] = useState<Product[]>([]);
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch products and banner in parallel
        const [productsRes, bannerRes] = await Promise.all([
          fetch("/api/allStoreProducts"),
          fetch("/api/hero-banner").catch(() => null),
        ]);

        if (!productsRes.ok) {
          throw new Error("Failed to fetch products");
        }

        const productsData = await productsRes.json();
        
        // Transform API products to match ProductCard interface
        const transformedProducts: Product[] = (productsData.products || []).map((p: ApiProduct) => {
          // Handle images - support both formats
          let productImages = p.images || [];
          if (productImages.length === 0 && p.primaryImage) {
            productImages = [{ 
              id: '1', 
              _id: '1',
              url: p.primaryImage, 
              alt_text: null,
              altText: null 
            }];
          }

          return {
            id: p._id,
            name: p.name,
            description: p.description || null,
            price: p.price,
            compare_at_price: p.compareAtPrice || p.compare_at_price || null,
            inventory_quantity: p.inventoryQuantity ?? p.inventory_quantity ?? 0, // ✅ Handle both field names
            images: productImages.map((img: any) => ({
              id: img.id || img._id?.toString() || '',
              url: img.url || '',
              alt_text: img.alt_text || img.altText || null,
            })),
            store_id: typeof p.storeId === 'string' ? p.storeId : p.storeId?._id || '',
            created_at: p.createdAt || p.created_at || new Date().toISOString(),
            updated_at: p.updatedAt || p.updated_at || new Date().toISOString(),
          };
        });

        console.log('✅ Transformed products:', transformedProducts.length);
        console.log('📦 Sample product inventory:', transformedProducts[0]?.inventory_quantity);

        setProducts(transformedProducts);

        // Handle banner
        if (bannerRes && bannerRes.ok) {
          const bannerData = await bannerRes.json();
          setHeroBanner(bannerData.banner || null);
        }

        setError(null);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
            {/* Background Image */}
            <Image
              src={heroBanner.imageUrl}
              alt={heroBanner.title || "Hero Banner"}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />

            {/* Content */}
            <div className="relative container mx-auto px-4 h-full flex items-center">
              <div className="max-w-3xl text-white">
                <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-3 tracking-tight drop-shadow-lg">
                  {heroBanner.title || "Discover Quality Products"}
                </h1>
                <p className="text-lg md:text-xl mb-6 text-white/90 drop-shadow-md">
                  {heroBanner.subtitle ||
                    "Browse our curated collection from trusted sellers"}
                </p>
              </div>
            </div>
          </>
        ) : (
          // Fallback gradient design
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-primary/5">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary rounded-full blur-3xl" />
              </div>
            </div>

            <div className="relative container mx-auto px-4 h-full flex items-center">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 tracking-tight">
                  Discover Quality Products
                </h1>
                <p className="text-lg text-muted-foreground">
                  Browse our curated collection from trusted sellers
                </p>
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
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition shadow-lg">
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
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary/90 transition shadow-lg">
                  Explore
                </button>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1 min-w-0">
            {/* Banner Ad Space */}
            <div className="border-0 shadow-lg rounded-2xl p-6 md:p-8 mb-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold mb-2 text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                    LIMITED TIME OFFER
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-blue-900 dark:text-blue-100">
                    Flash Sale - Today Only!
                  </h2>
                  <p className="text-blue-700 dark:text-blue-300 mb-4">
                    Get amazing deals on premium products
                  </p>
                  <button className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg">
                    Shop Flash Sale
                  </button>
                </div>
                <div className="hidden md:block text-5xl">⚡</div>
              </div>
            </div>

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      storeSlug="" // You'll need to get this from your API if needed
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