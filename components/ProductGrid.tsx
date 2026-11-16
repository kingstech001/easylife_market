"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { BrandLoader } from "@/components/ui/brand-loader";

type Product = ComponentProps<typeof ProductCard>["product"];

interface ProductGridProps {
  initialProducts: Product[];
  initialHasMore: boolean;
  pageSize: number;
  storeSlug: string;
  isRestaurant?: boolean;
}

export function ProductGrid({ initialProducts, initialHasMore, pageSize, storeSlug, isRestaurant }: ProductGridProps) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const loadMore = useCallback(async () => {
    if (inFlight.current || !hasMore) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    const request = new AbortController();
    controller.current = request;
    try {
      const response = await fetch(
        `/api/stores/${encodeURIComponent(storeSlug)}/products?page=${page + 1}&limit=${pageSize}`,
        { signal: request.signal },
      );
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.products) || !data.pagination) {
        throw new Error(data.message || "Unable to load more products.");
      }
      if (request.signal.aborted) return;
      setProducts((previous) => {
        const ids = new Set(previous.map((product) => product.id));
        return [...previous, ...data.products.filter((product: Product) => {
          if (ids.has(product.id)) return false;
          ids.add(product.id);
          return true;
        })];
      });
      setPage(page + 1);
      setHasMore(Boolean(data.pagination.hasNextPage) && data.products.length > 0);
    } catch (cause) {
      if (!request.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "Unable to load more products.");
      }
    } finally {
      inFlight.current = false;
      if (!request.signal.aborted) setLoading(false);
    }
  }, [hasMore, page, pageSize, storeSlug]);

  useEffect(() => {
    if (!hasMore || loading || error || !sentinel.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadMore();
    }, { rootMargin: "300px" });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, loading, error, loadMore]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4" aria-busy={loading}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} storeSlug={storeSlug} isRestaurant={isRestaurant} />
        ))}
      </div>
      {hasMore && (
        <div ref={sentinel} className="flex min-h-20 flex-col items-center justify-center gap-3">
          {loading ? <BrandLoader size={64} aria-label="Loading more products" /> : (
            <>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button variant="outline" onClick={() => void loadMore()}>
                {error ? "Try again" : "Load more products"}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
