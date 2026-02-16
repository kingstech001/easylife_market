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
  hasVariants?: boolean;
  variants?: Array<{
    color: {
      name: string;
      hex: string;
      _id?: string;
    };
    sizes: Array<{
      size: string;
      quantity: number;
      _id?: string;
    }>;
    priceAdjustment?: number;
    _id?: string;
  }>;
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
            //   store_slug: product.store_slug,
              created_at: product.created_at,
              updated_at: product.updated_at,
              hasVariants: product.hasVariants, // ✅ Pass variants flag
              variants: product.variants, // ✅ Pass variants data
            }}
            storeSlug={product.store_slug || ""}
          />
        ))}
      </div>
    </div>
  );
}