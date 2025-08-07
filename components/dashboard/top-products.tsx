"use client";

import { useState, useEffect, useCallback } from "react";
import { CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, PackageOpen } from "lucide-react";
import { toast } from "sonner";

type TopProduct = {
  productId: string;
  name: string;
  imageUrl?: string;
  totalQuantitySold: number;
  totalRevenue: number;
};

interface TopProductsProps {
  limit?: number;
}

export function TopProducts({ limit = 5 }: TopProductsProps) {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/seller/analytics/top-products?limit=${limit}`,
        { cache: "no-store" } // ✅ prevents stale data in Next.js
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch top products");
      }

      const realProducts = Array.isArray(result.data) ? result.data : [];
      setProducts(realProducts);
    } catch (err: any) {
      console.error("Error fetching top products:", err);
      setError(err.message || "An unexpected error occurred.");
      toast.error("Failed to load top products", {
        description: err.message || "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTopProducts();
  }, [fetchTopProducts]);

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">
          Loading top products...
        </span>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-[200px] text-destructive">
        <p>Error: {error}</p>
      </div>
    );
  }

  // ✅ Empty state
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        <PackageOpen />
      </div>
    );
  }

  // ✅ Success state
  return (
    <CardContent className="p-0">
      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={product.productId}>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 rounded-md">
                <AvatarImage
                  src={
                    product.imageUrl ||
                    "/placeholder.svg?height=48&width=48&query=product"
                  }
                  alt={product.name}
                />
                <AvatarFallback>
                  {product.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 grid gap-0.5">
                <p className="text-sm font-medium leading-none">
                  {product.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sold: {product.totalQuantitySold} units
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-medium">
                  ${product.totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>

            {index < products.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </div>
    </CardContent>
  );
}
