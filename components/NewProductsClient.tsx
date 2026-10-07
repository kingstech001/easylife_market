// components/NewProductsClient.tsx
//
// No "use client" needed: this component only maps data to <ProductCard>
// (which is itself a client component), so it can render on the server and
// ship less JavaScript to the browser.

import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ArrowRight, Package } from "lucide-react";

type ProductData = {
  _id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  inventory_quantity: number;
  images: { id: string; url: string; alt_text: string | null }[];
  store_id: string;
  store_slug?: string;
  created_at: string;
  updated_at: string;
  hasVariants?: boolean;
  hasModifiers?: boolean;
};

interface NewProductsClientProps {
  products: ProductData[];
}

export function NewProductsClient({ products }: NewProductsClientProps) {
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              No New Products Yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Check back soon for new arrivals!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-14">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          New arrivals
        </h2>

        <Link
          href="/allStoreProducts"
          className="flex items-center text-xs font-medium text-[#0E5A43] transition-colors hover:text-[#147b5c] md:text-sm"
        >
          View all
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={{
              id: product._id,
              name: product.name,
              description: product.description,
              price: product.price,
              compare_at_price: product.compare_at_price,
              inventory_quantity: product.inventory_quantity,
              images: product.images,
              store_id: product.store_id,
              created_at: product.created_at,
              updated_at: product.updated_at,
              hasVariants: product.hasVariants,
              hasModifiers: product.hasModifiers,
            }}
            storeSlug={product.store_slug || ""}
          />
        ))}
      </div>
    </section>
  );
}