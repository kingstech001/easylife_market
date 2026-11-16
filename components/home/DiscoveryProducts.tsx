"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { BrandLoader } from "@/components/ui/brand-loader";
import { Button } from "@/components/ui/button";
import type { DiscoveryBatch, DiscoveryProduct } from "@/lib/discovery-products";

export function DiscoveryProducts({ initialBatch, day }: { initialBatch: DiscoveryBatch | null; day: string }) {
  const [products, setProducts] = useState(initialBatch?.products || []);
  const [page, setPage] = useState(initialBatch ? 1 : 0);
  const [hasMore, setHasMore] = useState(initialBatch?.hasMore ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialBatch ? null : "Picks are taking a little longer. Please try again.");
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
      const response = await fetch(`/api/discovery-products?page=${page + 1}&day=${encodeURIComponent(day)}`, { signal: request.signal });
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.products) || typeof data.hasMore !== "boolean") {
        throw new Error(data.message || "Unable to load picks.");
      }
      if (request.signal.aborted) return;
      setProducts((previous) => {
        const ids = new Set(previous.map((product) => product.id));
        const counts = new Map<string, number>();
        previous.forEach((product) => counts.set(product.store_id, (counts.get(product.store_id) || 0) + 1));
        return [...previous, ...data.products.filter((product: DiscoveryProduct) => {
          const count = counts.get(product.store_id) || 0;
          if (ids.has(product.id) || count >= 3) return false;
          ids.add(product.id);
          counts.set(product.store_id, count + 1);
          return true;
        })];
      });
      setPage(page + 1);
      // Empty store batches must not prevent reaching later stores with products.
      setHasMore(data.hasMore);
    } catch (cause) {
      if (!request.signal.aborted) setError(cause instanceof Error ? cause.message : "Unable to load picks.");
    } finally {
      inFlight.current = false;
      if (!request.signal.aborted) setLoading(false);
    }
  }, [day, page, hasMore]);

  useEffect(() => {
    if (!hasMore || loading || error || !sentinel.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadMore();
    }, { rootMargin: "300px" });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, loading, error, loadMore]);

  return (
    <div className="space-y-6">
      <div aria-busy={loading} className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="min-w-0">
            <ProductCard product={product} storeSlug={product.store_slug} />
            <Link href={`/stores/${product.store_slug}`} className="mt-2 block truncate text-xs text-muted-foreground hover:text-[#0E5A43] hover:underline dark:hover:text-emerald-400">
              {product.store_name}
            </Link>
          </div>
        ))}
      </div>
      {!products.length && !hasMore && <p className="py-8 text-center text-sm text-muted-foreground">More discoveries are on the way. Check back soon.</p>}
      {hasMore && (
        <div ref={sentinel} className="flex min-h-20 flex-col items-center justify-center gap-3">
          {loading ? <BrandLoader size={64} aria-label="Loading more picks" /> : <>
            {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}
            <Button variant="outline" onClick={() => void loadMore()}>{error ? "Try again" : "Discover more"}</Button>
          </>}
        </div>
      )}
    </div>
  );
}
