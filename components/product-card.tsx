"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { toast } from "sonner";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id?: string;
  inventory_quantity: number;
  images: { id: string; url: string; alt_text: string | null }[];
  store_id: string;
  created_at: string;
  updated_at: string;
  hasVariants?: boolean;
  hasModifiers?: boolean;
  variants?:
    | Array<{
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
      }>
    | string; // Could be string if not parsed
}

interface ProductCardProps {
  product: Product;
  storeSlug: string;
  isRestaurant?: boolean;
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A43]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function ProductCard({ product, storeSlug }: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const resetTimer = useRef<number | null>(null);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { formatAmount } = useFormatAmount();

  useEffect(() => {
    return () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    };
  }, []);

  const mainImage = product.images?.[0];
  const productHref = `/stores/${storeSlug}/products/${product.id}`;
  const needsCustomization = product.hasModifiers;
  const shouldOpenProductPage = needsCustomization || product.hasVariants;
  const hasDiscount =
    !!product.compare_at_price && product.compare_at_price > product.price;
  const wishlisted = isInWishlist(product.id);

  if (product.inventory_quantity <= 0) {
    return null;
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: mainImage?.url || "/placeholder.svg",
      storeId: product.store_id,
      productId: product.id,
    });
    toast.success("Added to cart");

    // Brief checkmark so the tap feels acknowledged
    setJustAdded(true);
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setJustAdded(false), 1400);
  };

  const toggleWishlist = () => {
    if (wishlisted) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: mainImage?.url || "/placeholder.svg",
        storeSlug,
      });
      toast.success("Added to wishlist");
    }
  };

  const actionBtn = cn(
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
    "border-border bg-background text-foreground hover:border-[#0E5A43] hover:bg-[#0E5A43] hover:text-white",
    focusRing,
  );

  return (
    <article className="group flex h-full flex-col">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <Link
          href={productHref}
          aria-label={product.name}
          className={cn("absolute inset-0 block rounded-xl", focusRing)}
        >
          <Image
            src={mainImage?.url || "/placeholder.svg"}
            alt={mainImage?.alt_text || product.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </Link>

        {/* Wishlist: always visible on touch screens, fades in on hover on desktop */}
        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          className={cn(
            "absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground/70 shadow-sm backdrop-blur-sm transition-all duration-200 hover:text-foreground",
            "md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100",
            wishlisted && "md:opacity-100",
            focusRing,
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              wishlisted && "fill-red-500 text-red-500",
            )}
          />
        </button>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col pt-3">
        <Link
          href={productHref}
          className={cn("rounded-sm", focusRing)}
        >
          <h3 className="line-clamp-1 text-sm font-medium text-foreground transition-colors group-hover:text-[#0E5A43] dark:group-hover:text-emerald-400">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col-reverse items-baseline gap-x-2">
            <span className="whitespace-nowrap text-[15px] font-semibold tabular-nums text-foreground">
              {formatAmount(product.price)}
            </span>
            {hasDiscount && (
              <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground line-through">
                {formatAmount(product.compare_at_price!)}
              </span>
            )}
          </div>

          {shouldOpenProductPage ? (
            <Link
              href={productHref}
              className={actionBtn}
              aria-label={
                needsCustomization ? "Customize product" : "Select options"
              }
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label="Add to cart"
              className={cn(
                actionBtn,
                justAdded &&
                  "border-[#0E5A43] bg-[#0E5A43] text-white",
              )}
            >
              {justAdded ? (
                <Check className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}