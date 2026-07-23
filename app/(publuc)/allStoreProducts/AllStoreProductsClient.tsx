"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Package, Search } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-background lg:bg-[#083B2D]">
        <div className="absolute inset-0 hidden lg:block">
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
              <div className="absolute inset-0 bg-black/60" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[#083B2D]" />
          )}
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-4xl">
            <div className="hidden space-y-4 lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F4C430]">
                Product catalogue
              </p>
              <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {heroBanner?.title || "Discover quality products"}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7 lg:text-lg">
                {heroBanner?.subtitle ||
                  "Browse products from trusted sellers, food spots, and growing local businesses in one polished marketplace."}
              </p>
            </div>

            <div className="max-w-2xl rounded border border-border bg-white p-2 shadow-sm lg:mt-7 lg:border-white/15 lg:shadow-xl">
              <form onSubmit={handleSearch} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, food, gadgets, fashion..."
                    className={cn(
                      "h-12 rounded border-0 bg-transparent pl-11 pr-4 text-sm text-[#1F2937] shadow-none placeholder:text-muted-foreground focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-0",
                      "focus-visible:ring-2 focus-visible:ring-[#F4C430] focus-visible:ring-offset-0",
                      "sm:h-14 sm:text-[15px]"
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 rounded bg-[#0E5A43] px-4 text-sm font-semibold text-white hover:bg-[#083B2D] sm:h-12 sm:px-5"
                >
                  <ArrowRight className=" h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded  border-border bg-card sm:p-2">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#083B2D]">
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

          <div className="mt-5 flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide sm:gap-3">
            {categoryPreview.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  key={category.name}
                  href={buildCategorySearchUrl(category)}
                  className="flex min-w-[92px] snap-start flex-col items-center rounded border border-transparent transition hover:border-[#0E5A43]/25 hover:bg-[#0E5A43]/5 sm:min-w-[128px]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded bg-background shadow-sm ring-1 ring-border/60 transition-all">
                    <Icon className="h-5 w-5 text-[#0E5A43]" />
                  </div>
                  <p className="mt-4 text-[10px] font-semibold leading-5 text-foreground">
                    {category.name}
                  </p>
                </Link>
              );
            })}

            <Link
              href="/Search"
              className="flex min-w-[92px] snap-start flex-col items-center rounded border border-transparent p-2 transition hover:border-[#0E5A43]/25 hover:bg-[#0E5A43]/5 sm:min-w-[128px]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded bg-[#0E5A43] text-white shadow-sm">
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
          <div className="rounded border border-dashed border-border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded bg-[#0E5A43]/10">
              <Package className="h-10 w-10 text-[#0E5A43]" />
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#083B2D]">
                  Product catalogue
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  Latest products
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {initialProducts.length} item{initialProducts.length === 1 ? "" : "s"} available now.
                </p>
              </div>
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

          </>
        )}
      </section>
    </div>
  );
}
