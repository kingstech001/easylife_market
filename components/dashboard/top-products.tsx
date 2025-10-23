"use client";

import { useState, useEffect, useCallback } from "react";
import { CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

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
  const { user } = useAuth();

  const fetchTopProducts = useCallback(async () => {
    if (!user) return; // Don't fetch until user is loaded
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl =
        user.role === "admin"
          ? `/api/dashboard/admin/analytics/top-products?limit=${limit}`
          : `/api/dashboard/seller/analytics/top-products?limit=${limit}`;

      const res = await fetch(apiUrl, {
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to fetch top products");
      }

      const realProducts = Array.isArray(json.products)
        ? json.products.map((p: any) => ({
            productId: p._id,
            name: p.name,
            imageUrl:
              Array.isArray(p.images) && p.images.length > 0
                ? p.images[0].url || p.images[0]
                : undefined,
            totalQuantitySold: p.totalSold,
            totalRevenue: p.totalRevenue,
          }))
        : [];
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
  }, [limit, user]);

  useEffect(() => {
    if (user) {
      fetchTopProducts();
    }
  }, [fetchTopProducts, user]);

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-[200px] text-destructive">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        <PackageOpen />
      </div>
    );
  }

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
                  ₦{product.totalRevenue.toFixed(2)}
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
