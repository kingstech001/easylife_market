// components/NewProductsClient.tsx
"use client";

import { ProductCard } from "@/components/product-card";
import { Package } from "lucide-react";

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
};

interface NewProductsClientProps {
  products: ProductData[];
}

export function NewProductsClient({ products }: NewProductsClientProps) {
  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">No New Products Yet</h3>
            <p className="text-sm text-muted-foreground">Check back soon for new arrivals!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-8 text-center lg:text-left">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2">
          <span className="bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-primary bg-clip-text text-transparent">
            New{" "}
          </span>
          <span className="text-foreground">Products</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Discover the latest additions from our sellers
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={{
              id: product._id,
              name: product.name,
              description: product.description,
              price: product.price,
              compare_at_price: product.compare_at_price,
              category_id: undefined,
              inventory_quantity: product.inventory_quantity,
              images: product.images,
              store_id: product.store_id,
              created_at: product.created_at,
              updated_at: product.updated_at,
            }}
            storeSlug={product.store_slug || ""}
          />
        ))}
      </div>
    </div>
  );
}