// components/ProductGrid.tsx
"use client";

import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ProductGridProps {
  initialProducts: any[];
  totalProducts: number;
  storeId: string;
  storeSlug: string;
}

export function ProductGrid({ 
  initialProducts, 
  totalProducts, 
  storeId,
  storeSlug 
}: ProductGridProps) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const hasMore = products.length < totalProducts;

  async function loadMore() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/stores/${storeId}/products?page=${page + 1}&limit=20`
      );
      const data = await response.json();
      
      setProducts(prev => [...prev, ...data.products]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {products.map((product) => (
          <ProductCard 
            key={product._id} 
            product={product} 
            storeSlug={storeSlug}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button 
            onClick={loadMore} 
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Load More (${totalProducts - products.length} remaining)`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}