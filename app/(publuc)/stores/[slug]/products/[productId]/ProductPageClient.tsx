"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BadgeCheck,
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { toast } from "sonner";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import ExpandableText from "@/components/ExpandableText";
import ModifierSection, { type ModifierGroup } from "@/components/Modifiersection";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface VariantColor {
  name: string;
  hex: string;
  _id?: string;
}

interface VariantSize {
  size: string;
  quantity: number;
  _id?: string;
}

interface ProductVariant {
  color: VariantColor;
  sizes: VariantSize[];
  priceAdjustment?: number;
  _id?: string;
}

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
  variants?: ProductVariant[] | string;
  hasModifiers?: boolean;
  modifierGroups?: ModifierGroup[] | string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  categories?: string[];
}

interface ProductPageClientProps {
  initialProduct: Product;
  initialStore: Store;
  initialRelatedProducts: Product[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isRestaurantStore(store: Store): boolean {
  return (store.categories ?? []).some(
    (c) => c.toLowerCase() === "restaurant" || c.toLowerCase() === "restaurants",
  );
}

// Data may arrive as an array or a JSON string
function parseList<T>(value: T[] | string | undefined | null): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A43]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function ProductPageClient({
  initialProduct: product,
  initialStore: store,
  initialRelatedProducts: relatedProducts,
}: ProductPageClientProps) {
  const { formatAmount } = useFormatAmount();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const isRestaurant = isRestaurantStore(store);

  const variants = useMemo(
    () => parseList<ProductVariant>(product.variants),
    [product.variants],
  );
  const modifierGroups = useMemo(
    () => parseList<ModifierGroup>(product.modifierGroups),
    [product.modifierGroups],
  );
  const showModifiers =
    isRestaurant && !!product.hasModifiers && modifierGroups.length > 0;

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  // Start with the first variant selected (no effect needed)
  const firstVariant = product.hasVariants ? variants[0] : undefined;
  const [selectedColor, setSelectedColor] = useState<string | null>(
    firstVariant?.color.name ?? null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    firstVariant?.sizes[0]?.size ?? null,
  );

  // Modifier selections: groupKey -> optionKeys[]
  const [modifierSelections, setModifierSelections] = useState<
    Record<string, string[]>
  >({});

  const wishlisted = isInWishlist(product.id);

  // ── Derived values ───────────────────────────────────────────────────────
  const availableSizes: VariantSize[] =
    product.hasVariants && selectedColor
      ? (variants.find((v) => v.color.name === selectedColor)?.sizes ?? [])
      : [];

  const currentStock = (() => {
    if (!product.hasVariants || !selectedColor || !selectedSize) {
      return product.inventory_quantity || 0;
    }
    const variant = variants.find((v) => v.color.name === selectedColor);
    return variant?.sizes.find((s) => s.size === selectedSize)?.quantity || 0;
  })();

  const modifierPriceAddition = (() => {
    if (!showModifiers) return 0;
    let total = 0;
    for (const group of modifierGroups) {
      const key = group._id || group.name;
      for (const optKey of modifierSelections[key] || []) {
        const option = group.options.find((o) => (o._id || o.name) === optKey);
        if (option) total += option.priceAdjustment;
      }
    }
    return total;
  })();

  const currentPrice = (() => {
    let base = product.price;
    if (product.hasVariants && selectedColor) {
      base += variants.find((v) => v.color.name === selectedColor)?.priceAdjustment || 0;
    }
    return base + modifierPriceAddition;
  })();

  const hasDiscount =
    !!product.compare_at_price && product.compare_at_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) / product.compare_at_price!) * 100,
      )
    : 0;

  const safeQuantity = Math.max(1, Math.min(quantity, currentStock || 1));
  const outOfStock = currentStock === 0;
  const ctaLabel = outOfStock
    ? isRestaurant
      ? "Not available"
      : "Out of stock"
    : isRestaurant
      ? "Add to order"
      : "Add to cart";

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleModifierToggle = (
    groupKey: string,
    optionKey: string,
    selectionType: "single" | "multiple",
    maxSelection: number,
  ) => {
    setModifierSelections((prev) => {
      const current = prev[groupKey] || [];

      if (selectionType === "single") {
        return {
          ...prev,
          [groupKey]: current.includes(optionKey) ? [] : [optionKey],
        };
      }

      if (current.includes(optionKey)) {
        return { ...prev, [groupKey]: current.filter((id) => id !== optionKey) };
      }
      if (current.length >= maxSelection) {
        toast.error(
          `You can only pick up to ${maxSelection} option${maxSelection > 1 ? "s" : ""} here`,
        );
        return prev;
      }
      return { ...prev, [groupKey]: [...current, optionKey] };
    });
  };

  const validateModifiers = (): boolean => {
    if (!showModifiers) return true;
    for (const group of modifierGroups) {
      if (!group.required) continue;
      const selected = modifierSelections[group._id || group.name] || [];
      if (selected.length < group.minSelection) {
        toast.error(
          `Please select at least ${group.minSelection} option${group.minSelection > 1 ? "s" : ""} for "${group.name}"`,
        );
        return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (product.hasVariants) {
      if (!selectedColor) return void toast.error("Please select a color");
      if (!selectedSize) return void toast.error("Please select a size");
    }
    if (!validateModifiers()) return;
    if (currentStock === 0) {
      toast.error("This item is out of stock");
      return;
    }

    const selectedVariant = variants.find((v) => v.color.name === selectedColor);

    const selectedModifiers = showModifiers
      ? modifierGroups
          .map((group) => {
            const ids = modifierSelections[group._id || group.name] || [];
            const chosen = group.options.filter((o) => ids.includes(o._id || o.name));
            if (chosen.length === 0) return null;
            return {
              groupName: group.name,
              options: chosen.map((o) => ({
                name: o.name,
                priceAdjustment: o.priceAdjustment,
              })),
            };
          })
          .filter(Boolean)
      : undefined;

    const item: any = {
      id: product.id,
      name: product.name,
      price: currentPrice,
      quantity: safeQuantity,
      image: product.images[0]?.url || "/placeholder.svg",
      storeId: product.store_id,
      productId: product.id,
      selectedVariant:
        product.hasVariants && selectedColor && selectedSize
          ? {
              color: {
                name: selectedColor,
                hex: selectedVariant?.color.hex || "#000000",
              },
              size: selectedSize,
            }
          : undefined,
      selectedModifiers,
    };

    addToCart(item);
    toast.success("Added to cart", {
      description: `${product.name} has been added to your cart`,
    });

    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
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
        image: product.images[0]?.url || "/placeholder.svg",
        storeSlug: store.slug,
      });
      toast.success("Added to wishlist");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      // share sheet dismissed
    }
  };

  const stockLabel = outOfStock
    ? isRestaurant
      ? "Not available"
      : "Out of stock"
    : isRestaurant
      ? "Available"
      : currentStock < 10
        ? `Only ${currentStock} left`
        : "In stock";

  const mainImage = product.images[selectedImage] ?? product.images[0];

  const addButtonClass = cn(
    "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0E5A43] px-6 text-base font-semibold text-white transition-colors hover:bg-[#083B2D] disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
    focusRing,
  );

  const AddIcon = isRestaurant ? UtensilsCrossed : ShoppingCart;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* bottom padding leaves room for the mobile buy bar + bottom nav */}
      <div className="mx-auto max-w-6xl px-4 pb-44 pt-4 sm:px-6 md:pb-14 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex items-center gap-1.5 overflow-hidden text-sm text-muted-foreground"
        >
          <Link href="/stores" className="shrink-0 hover:text-foreground">
            Stores
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link
            href={`/stores/${store.slug}`}
            className="max-w-[10rem] truncate hover:text-foreground sm:max-w-xs"
          >
            {store.name}
          </Link>
          <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
          <span className="hidden truncate text-foreground sm:block">
            {product.name}
          </span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
          {/* ── Gallery ─────────────────────────────────────────────────── */}
          <div className="space-y-3 md:sticky md:top-20 md:self-start">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
              <Image
                src={mainImage?.url || "/placeholder.svg"}
                alt={mainImage?.alt_text || product.name}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 540px, (min-width: 768px) 46vw, 100vw"
              />
              {hasDiscount && (
                <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                  -{discountPercentage}%
                </span>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {product.images.map((image, index) => (
                  <button
                    key={image.id || index}
                    type="button"
                    aria-label={`Show image ${index + 1}`}
                    aria-pressed={selectedImage === index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted transition-all sm:h-[72px] sm:w-[72px]",
                      selectedImage === index
                        ? "ring-2 ring-[#0E5A43] ring-offset-2 ring-offset-background"
                        : "opacity-70 hover:opacity-100",
                      focusRing,
                    )}
                  >
                    <Image
                      src={image.url || "/placeholder.svg"}
                      alt={image.alt_text || `Product image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="72px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ────────────────────────────────────────────────────── */}
          <div className="min-w-0 space-y-6">
            {/* Seller */}
            <Link
              href={`/stores/${store.slug}`}
              className="group inline-flex items-center gap-2.5"
            >
              {store.logo_url ? (
                <Image
                  src={store.logo_url}
                  alt={store.name}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {store.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {isRestaurant ? "Prepared by" : "Sold by"}{" "}
                <span className="font-medium text-foreground group-hover:underline">
                  {store.name}
                </span>
              </span>
              <BadgeCheck className="h-4 w-4 text-[#0E5A43] dark:text-emerald-400" />
            </Link>

            {/* Title + price */}
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {formatAmount(currentPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-lg tabular-nums text-muted-foreground line-through">
                    {formatAmount(product.compare_at_price!)}
                  </span>
                )}
              </div>

              {hasDiscount && (
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  You save {formatAmount(product.compare_at_price! - product.price)}
                </p>
              )}
              {modifierPriceAddition > 0 && (
                <p className="text-xs font-medium text-[#0E5A43] dark:text-emerald-400">
                  Includes +{formatAmount(modifierPriceAddition)} in add-ons
                </p>
              )}

              <p
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium",
                  outOfStock
                    ? "text-red-600 dark:text-red-400"
                    : "text-[#0E5A43] dark:text-emerald-400",
                )}
              >
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
                {stockLabel}
                {!outOfStock &&
                  product.hasVariants &&
                  selectedColor &&
                  selectedSize && (
                    <span className="font-normal text-muted-foreground">
                      ({selectedColor} · {selectedSize})
                    </span>
                  )}
              </p>
            </div>

            {/* Variants (retail only) */}
            {!isRestaurant && product.hasVariants && variants.length > 0 && (
              <div className="space-y-5 border-t border-border pt-6">
                <div>
                  <h2 className="mb-3 text-sm font-semibold">
                    Color:{" "}
                    <span className="font-normal text-muted-foreground">
                      {selectedColor}
                    </span>
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant) => {
                      const active = selectedColor === variant.color.name;
                      return (
                        <button
                          key={variant._id || variant.color.name}
                          type="button"
                          aria-pressed={active}
                          onClick={() => {
                            setSelectedColor(variant.color.name);
                            setSelectedSize(variant.sizes[0]?.size ?? null);
                          }}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                            active
                              ? "border-[#0E5A43] bg-[#0E5A43]/5 text-foreground ring-1 ring-[#0E5A43]"
                              : "border-border hover:border-foreground/40",
                            focusRing,
                          )}
                        >
                          <span
                            aria-hidden
                            className="h-4 w-4 rounded-full border border-black/10"
                            style={{ backgroundColor: variant.color.hex }}
                          />
                          {variant.color.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedColor && availableSizes.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-sm font-semibold">
                      Size:{" "}
                      <span className="font-normal text-muted-foreground">
                        {selectedSize}
                      </span>
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((sizeData) => {
                        const active = selectedSize === sizeData.size;
                        const soldOut = sizeData.quantity === 0;
                        return (
                          <button
                            key={sizeData.size}
                            type="button"
                            disabled={soldOut}
                            aria-pressed={active}
                            onClick={() => setSelectedSize(sizeData.size)}
                            className={cn(
                              "min-w-[3rem] rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                              active
                                ? "border-[#0E5A43] bg-[#0E5A43]/5 ring-1 ring-[#0E5A43]"
                                : "border-border hover:border-foreground/40",
                              soldOut &&
                                "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:border-border",
                              focusRing,
                            )}
                          >
                            {sizeData.size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modifiers (restaurants) */}
            {showModifiers && (
              <div className="border-t border-border pt-6">
                <ModifierSection
                  groups={modifierGroups}
                  selections={modifierSelections}
                  onToggle={handleModifierToggle}
                  formatAmount={formatAmount}
                />
              </div>
            )}

            {/* Quantity + actions */}
            <div className="space-y-3 border-t border-border pt-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 items-center rounded-xl border border-border"
                  role="group"
                  aria-label="Quantity"
                >
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={safeQuantity <= 1}
                    className={cn(
                      "flex h-12 w-11 items-center justify-center rounded-l-xl text-foreground transition-colors hover:bg-muted disabled:opacity-40",
                      focusRing,
                    )}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-base font-semibold tabular-nums">
                    {safeQuantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    disabled={safeQuantity >= currentStock}
                    className={cn(
                      "flex h-12 w-11 items-center justify-center rounded-r-xl text-foreground transition-colors hover:bg-muted disabled:opacity-40",
                      focusRing,
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Desktop add button (mobile uses the sticky bar below) */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className={cn(addButtonClass, "hidden flex-1 md:inline-flex")}
                >
                  {justAdded ? (
                    <>
                      <Check className="h-5 w-5" /> Added
                    </>
                  ) : (
                    <>
                      <AddIcon className="h-5 w-5" /> {ctaLabel}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleWishlist}
                  aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                  aria-pressed={wishlisted}
                  className={cn(
                    "ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border transition-colors hover:bg-muted md:ml-0",
                    focusRing,
                  )}
                >
                  <Heart
                    className={cn(
                      "h-5 w-5 transition-colors",
                      wishlisted && "fill-red-500 text-red-500",
                    )}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share"
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border transition-colors hover:bg-muted",
                    focusRing,
                  )}
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              <ul className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Secure payment
                </li>
                <li className="flex items-center gap-1.5">
                  {isRestaurant ? (
                    <UtensilsCrossed className="h-4 w-4" />
                  ) : (
                    <Truck className="h-4 w-4" />
                  )}
                  {isRestaurant ? "Freshly prepared" : "Fast delivery"}
                </li>
                <li className="flex items-center gap-1.5">
                  <Award className="h-4 w-4" /> Quality guaranteed
                </li>
              </ul>
            </div>

            {/* Details */}
            <div className="space-y-6 border-t border-border pt-6">
              <section>
                <h2 className="mb-2 text-sm font-semibold">Description</h2>
                <div className="text-sm leading-6 text-muted-foreground">
                  <ExpandableText
                    text={product.description || "No description available for this product."}
                    limit={140}
                  />
                </div>
              </section>

              <section>
                <h2 className="mb-2 text-sm font-semibold">Details</h2>
                <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">SKU</dt>
                  <dd className="text-right font-mono text-xs text-foreground sm:text-left">
                    SKU-{product.id.slice(0, 8)}
                  </dd>
                  <dt className="text-muted-foreground">
                    {isRestaurant ? "Restaurant" : "Store"}
                  </dt>
                  <dd className="text-right text-foreground sm:text-left">{store.name}</dd>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="text-right text-foreground sm:text-left">
                    {product.category_id || "Uncategorized"}
                  </dd>
                  {!isRestaurant && product.hasVariants && (
                    <>
                      <dt className="text-muted-foreground">Colors</dt>
                      <dd className="text-right text-foreground sm:text-left">
                        {variants.length} available
                      </dd>
                    </>
                  )}
                  {showModifiers && (
                    <>
                      <dt className="text-muted-foreground">Customisations</dt>
                      <dd className="text-right text-foreground sm:text-left">
                        {modifierGroups.length} option group
                        {modifierGroups.length === 1 ? "" : "s"}
                      </dd>
                    </>
                  )}
                </dl>
              </section>

              <section>
                <h2 className="mb-2 text-sm font-semibold">
                  {isRestaurant ? "Preparation" : "Delivery"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isRestaurant
                    ? "Estimated preparation: 15–30 minutes"
                    : "Estimated delivery: 24 hours"}
                </p>
              </section>
            </div>
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 sm:mt-20">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                More from {store.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You might also like these {isRestaurant ? "dishes" : "products"}.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4">
              {relatedProducts.map((related) => (
                <ProductCard
                  key={related.id}
                  product={related}
                  storeSlug={store.slug}
                  isRestaurant={isRestaurant}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile buy bar: sits above the bottom navigation (h-16) */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="truncate text-lg font-bold tabular-nums">
              {formatAmount(currentPrice * safeQuantity)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={cn(addButtonClass, "flex-1")}
          >
            {justAdded ? (
              <>
                <Check className="h-5 w-5" /> Added
              </>
            ) : (
              <>
                <AddIcon className="h-5 w-5" /> {ctaLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}