"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Package, Search, Store } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

export default function AllStoreProductsClient({
  initialProducts,
  initialBanner,
}: AllStoreProductsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [heroBanner] = useState<HeroBanner | null>(initialBanner);

  const categoryPreview = useMemo(() => CATEGORIES.slice(0, 8), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.push(`/Search?search=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(225,162,0,0.06),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.18))]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {heroBanner?.imageUrl ? (
            <>
              <div className="absolute inset-0">
                <Image
                  key={heroBanner.id}
                  src={heroBanner.imageUrl}
                  alt={heroBanner.title || "Hero banner"}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.78)_0%,rgba(8,8,8,0.6)_48%,rgba(8,8,8,0.78)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(225,162,0,0.22),transparent_34%)]" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(225,162,0,0.18),rgba(255,255,255,0.02)_35%,rgba(0,0,0,0.02)_100%)]" />
              <div className="absolute left-[-10%] top-[-8%] h-48 w-48 rounded-full bg-[#e1a200]/20 blur-3xl sm:h-64 sm:w-64" />
              <div className="absolute bottom-[-12%] right-[-8%] h-56 w-56 rounded-full bg-foreground/10 blur-3xl sm:h-72 sm:w-72" />
            </>
          )}
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 lg:px-8 lg:pb-14 lg:pt-8">
          <div className="mx-auto max-w-4xl">
            <div className="mt-5 space-y-4 sm:mt-7 sm:space-y-5">
              <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-6xl">
                {heroBanner?.title || "Discover quality products"}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7 lg:text-lg">
                {heroBanner?.subtitle ||
                  "Browse products from trusted sellers, food spots, and growing local businesses in one polished marketplace."}
              </p>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-black/20 backdrop-blur-md sm:mt-8 sm:p-4">
              <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center relative">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, food, gadgets, fashion..."
                    className={cn(
                      "h-12 rounded-full border-0 bg-white/12 pl-11 pr-4 text-sm text-white shadow-none placeholder:text-foreground/70 focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#f0c14b] focus-visible:ring-offset-0",
                      "focus-visible:ring-2 focus-visible:ring-[#f0c14b] focus-visible:ring-offset-0",
                      "sm:h-14 sm:text-[15px]"
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className=" flex items-center rounded-full px-3 py-0 bg-[#e1a200] text-sm font-semibold text-white hover:bg-[#c89100] absolute right-0 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0"
                >
                  <ArrowRight className=" h-4 w-4" />
                </Button>
              </form>

              {/* <div className="mt-3 flex flex-wrap gap-2">
                {["Restaurants", "Groceries", "Fashion", "Tech"].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => router.push(`/Search?search=${encodeURIComponent(term)}`)}
                    className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/14"
                  >
                    {term}
                  </button>
                ))}
              </div> */}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-border/70 bg-background/85 p-4 shadow-sm backdrop-blur sm:p-5 lg:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a97500]">
                Browse categories
              </p>
             
            </div>
            <Link
              href="/Search"
              className="hidden text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {categoryPreview.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  key={category.name}
                  href={buildCategorySearchUrl(category)}
                  className="flex flex-col items-center min-w-[118px] snap-start rounded-3xl border border-border/70 bg-muted/30 p-2 transition hover:border-[#e1a200]/45 hover:bg-[#e1a200]/[0.06] hover:shadow-md sm:min-w-[132px]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border/60">
                    <Icon className="h-5 w-5 text-[#e1a200]" />
                  </div>
                  <p className="mt-4 text-[10px] font-semibold leading-5 text-foreground">
                    {category.name}
                  </p>
                </Link>
              );
            })}

            <Link
              href="/Search"
              className="flex flex-col items-center  min-w-[118px] snap-start rounded-3xl border border-dashed border-[#e1a200]/40 bg-[#e1a200]/[0.04] p-2 transition hover:bg-[#e1a200]/[0.08] sm:min-w-[132px]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e1a200] text-white shadow-sm">
                <ArrowRight className="h-5 w-5" />
              </div>
              <p className="mt-4 text-[10px] font-semibold leading-5 text-foreground">
                Explore more
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-14" id="products">
        {initialProducts.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-border bg-background p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#e1a200]/10">
              <Package className="h-10 w-10 text-[#e1a200]" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-foreground">No products found</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              There are no products available right now. Check back shortly for new arrivals from stores and restaurants.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a97500]">
                  Product catalogue
                </p>
                {/* <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                  Fresh picks across every category
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Browse a growing collection of products from trusted stores, food vendors, and local businesses.
                </p> */}
              </div>
              {/* <div className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
                <Store className="h-4 w-4 text-[#e1a200]" />
                {initialProducts.length} products available
              </div> */}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {initialProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeSlug={product.store_slug || ""}
                />
              ))}
            </div>

            <div className="mt-8 rounded-[30px] border border-[#e1a200]/20 bg-[linear-gradient(135deg,rgba(225,162,0,0.12),rgba(225,162,0,0.03)_45%,rgba(255,255,255,0.6)_100%)] p-5 shadow-sm sm:p-6 lg:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6500]">
                    Stay updated
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-foreground">
                    Get weekly deals and new arrivals first
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Subscribe for product launches, restaurant specials, and standout marketplace offers.
                  </p>
                </div>

                <div className="w-full max-w-xl">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="h-12 rounded-full border-border bg-background/90 px-4"
                    />
                    <Button className="h-12 rounded-full bg-[#e1a200] px-6 text-white hover:bg-[#c89100]">
                      Subscribe
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
