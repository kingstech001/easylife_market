"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Share2,
  Star,
  ChevronLeft,
  Check,
  Info,
  Loader2,
  Package,
  Truck,
  ShieldCheck,
  Clock,
  Store as StoreIcon,
  BadgeCheck,
  Minus,
  Plus,
  MapPin,
  Award,
  UtensilsCrossed,
  ChefHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { toast } from "sonner";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import ExpandableText from "@/components/ExpandableText";
import ModifierSection, { type ModifierGroup } from "@/components/Modifiersection";

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
// Helper: is this store a restaurant?
// ─────────────────────────────────────────────
function isRestaurantStore(store: Store): boolean {
  if (!store.categories || store.categories.length === 0) return false;
  return store.categories.some(
    (c) => c.toLowerCase() === "restaurant" || c.toLowerCase() === "restaurants"
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function ProductPageClient({
  initialProduct,
  initialStore,
  initialRelatedProducts,
}: ProductPageClientProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { formatAmount } = useFormatAmount();

  // Variant selection states
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Modifier selections: Record<groupKey, optionKey[]>
  const [modifierSelections, setModifierSelections] = useState<Record<string, string[]>>({});

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const product = initialProduct;
  const store = initialStore;
  const relatedProducts = initialRelatedProducts;

  const isRestaurant = isRestaurantStore(store);

  // ── Parse variants ───────────────────────────────────────────────────────
  const getParsedVariants = (): ProductVariant[] | undefined => {
    if (!product?.variants) return undefined;
    try {
      if (typeof product.variants === "string") {
        return JSON.parse(product.variants) as ProductVariant[];
      } else if (Array.isArray(product.variants)) {
        return product.variants;
      }
    } catch (error) {
      console.error("❌ [ProductPage] Error parsing variants:", error);
    }
    return undefined;
  };

  // ── Parse modifierGroups ─────────────────────────────────────────────────
  const getParsedModifierGroups = (): ModifierGroup[] => {
    if (!product?.modifierGroups) return [];
    try {
      if (typeof product.modifierGroups === "string") {
        return JSON.parse(product.modifierGroups) as ModifierGroup[];
      } else if (Array.isArray(product.modifierGroups)) {
        return product.modifierGroups;
      }
    } catch (error) {
      console.error("❌ [ProductPage] Error parsing modifierGroups:", error);
    }
    return [];
  };

  const parsedVariants = getParsedVariants();
  const parsedModifierGroups = getParsedModifierGroups();
  const showModifiers = isRestaurant && product.hasModifiers && parsedModifierGroups.length > 0;

  // Auto-select first variant
  useEffect(() => {
    if (product?.hasVariants && parsedVariants && parsedVariants.length > 0 && !selectedColor) {
      const firstVariant = parsedVariants[0];
      setSelectedColor(firstVariant.color.name);
      if (firstVariant.sizes.length > 0) {
        setSelectedSize(firstVariant.sizes[0].size);
      }
    }
  }, [product?.hasVariants, parsedVariants, selectedColor]);

  // ── Modifier toggle handler ──────────────────────────────────────────────
  const handleModifierToggle = (
    groupKey: string,
    optionKey: string,
    selectionType: "single" | "multiple",
    maxSelection: number
  ) => {
    setModifierSelections((prev) => {
      const current = prev[groupKey] || [];

      if (selectionType === "single") {
        // Radio behaviour — replace selection
        if (current.includes(optionKey)) {
          // Allow de-select only if not required (handled at validation time)
          return { ...prev, [groupKey]: [] };
        }
        return { ...prev, [groupKey]: [optionKey] };
      }

      // Multiple / checkbox behaviour
      if (current.includes(optionKey)) {
        return { ...prev, [groupKey]: current.filter((id) => id !== optionKey) };
      }
      if (current.length >= maxSelection) {
        toast.error(`You can only pick up to ${maxSelection} option${maxSelection > 1 ? "s" : ""} here`);
        return prev;
      }
      return { ...prev, [groupKey]: [...current, optionKey] };
    });
  };

  // ── Validate required modifier groups ────────────────────────────────────
  const validateModifiers = (): boolean => {
    if (!showModifiers) return true;
    for (const group of parsedModifierGroups) {
      if (!group.required) continue;
      const groupKey = group._id || group.name;
      const selected = modifierSelections[groupKey] || [];
      if (selected.length < group.minSelection) {
        toast.error(`Please select at least ${group.minSelection} option${group.minSelection > 1 ? "s" : ""} for "${group.name}"`);
        return false;
      }
    }
    return true;
  };

  // ── Compute modifier price additions ─────────────────────────────────────
  const getModifierPriceAddition = (): number => {
    if (!showModifiers) return 0;
    let total = 0;
    for (const group of parsedModifierGroups) {
      const groupKey = group._id || group.name;
      const selectedIds = modifierSelections[groupKey] || [];
      for (const optId of selectedIds) {
        const option = group.options.find((o) => (o._id || o.name) === optId);
        if (option) total += option.priceAdjustment;
      }
    }
    return total;
  };

  // ── Getters ───────────────────────────────────────────────────────────────
  const getAvailableSizes = (): VariantSize[] => {
    if (!product?.hasVariants || !parsedVariants || !selectedColor) return [];
    const variant = parsedVariants.find((v) => v.color.name === selectedColor);
    return variant?.sizes || [];
  };

  const getCurrentStock = (): number => {
    if (!product?.hasVariants || !selectedColor || !selectedSize) {
      return product?.inventory_quantity || 0;
    }
    const variant = parsedVariants?.find((v) => v.color.name === selectedColor);
    const sizeData = variant?.sizes.find((s) => s.size === selectedSize);
    return sizeData?.quantity || 0;
  };

  const getCurrentPrice = (): number => {
    if (!product) return 0;
    let base = product.price;
    if (product.hasVariants && selectedColor) {
      const variant = parsedVariants?.find((v) => v.color.name === selectedColor);
      base += variant?.priceAdjustment || 0;
    }
    return base + getModifierPriceAddition();
  };

  // ── Add to cart ──────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!product) return;

    if (product.hasVariants) {
      if (!selectedColor) { toast.error("Please select a color"); return; }
      if (!selectedSize)  { toast.error("Please select a size");  return; }
    }

    if (!validateModifiers()) return;

    const currentStock = getCurrentStock();
    if (currentStock === 0) { toast.error("This variant is out of stock"); return; }

    setIsAddingToCart(true);
    setTimeout(() => {
      setIsAddingToCart(false);
      const selectedVariant = parsedVariants?.find((v) => v.color.name === selectedColor);

      // Build selected modifiers summary for cart
      const selectedModifiers = showModifiers
        ? parsedModifierGroups
            .map((group) => {
              const groupKey = group._id || group.name;
              const selectedIds = modifierSelections[groupKey] || [];
              const chosenOptions = group.options.filter((o) =>
                selectedIds.includes(o._id || o.name)
              );
              if (chosenOptions.length === 0) return null;
              return {
                groupName: group.name,
                options: chosenOptions.map((o) => ({
                  name: o.name,
                  priceAdjustment: o.priceAdjustment,
                })),
              };
            })
            .filter(Boolean)
        : undefined;

      addToCart({
        id: product.id,
        name: product.name,
        price: getCurrentPrice(),
        quantity,
        image: product.images[0]?.url || "/placeholder.svg",
        storeId: product.store_id,
        productId: product.id,
        selectedVariant:
          product.hasVariants && selectedColor && selectedSize
            ? {
                color: { name: selectedColor, hex: selectedVariant?.color.hex || "#000000" },
                size: selectedSize,
              }
            : undefined,
        // @ts-ignore — extend your cart type to include this if needed
        selectedModifiers: selectedModifiers ?? undefined,
      });

      toast.success("Added to cart", {
        description: `${product.name} has been added to your cart`,
      });
    }, 1000);
  };

  const toggleWishlist = () => {
    if (!product || !store) return;
    const wishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || "/placeholder.svg",
      storeSlug: store.slug,
    };
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(wishlistItem);
      toast.success("Added to wishlist");
    }
  };

  const incrementQuantity = () => {
    const currentStock = getCurrentStock();
    if (quantity < currentStock) setQuantity((prev) => prev + 1);
  };
  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const currentStock = getCurrentStock();
  const currentPrice = getCurrentPrice();
  const modifierPriceAddition = getModifierPriceAddition();
  const availableSizes = getAvailableSizes();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container py-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <AnimatedContainer animation="fadeIn">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 hover:bg-primary/10 rounded-xl"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </AnimatedContainer>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {/* ── LEFT: Images ─────────────────────────────────────────────── */}
          <div className="lg:max-w-[600px] mx-auto w-full">
            <AnimatedContainer animation="slideIn" className="space-y-4 sticky top-8">
              {/* Main Image */}
              <Card className="overflow-hidden border-2">
                <div className="relative aspect-square bg-muted">
                  <Image
                    src={product.images[selectedImage]?.url || "/placeholder.svg?height=800&width=800"}
                    alt={product.images[selectedImage]?.alt_text || product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  {hasDiscount && (
                    <div className="absolute top-6 left-6">
                      <Badge className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 text-sm font-bold shadow-lg">
                        -{discountPercentage}% OFF
                      </Badge>
                    </div>
                  )}
                  {/* Restaurant badge */}
                  {isRestaurant && (
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-orange-500/90 backdrop-blur-sm text-white gap-1.5 px-3 py-1.5 shadow-lg">
                        <UtensilsCrossed className="h-3.5 w-3.5" />
                        Restaurant
                      </Badge>
                    </div>
                  )}
                  {currentStock < 10 && currentStock > 0 && (
                    <div className="absolute top-6 right-6">
                      <Badge className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-2 shadow-lg">
                        Only {currentStock} left!
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-3 pb-2">
                  {product.images.map((image, index) => (
                    <motion.button
                      key={image.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative aspect-square w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl transition-all ${
                        selectedImage === index
                          ? "ring-2 ring-[#e1a200] border-primary shadow-lg"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <Image
                        src={image.url || "/placeholder.svg"}
                        alt={image.alt_text || `Product image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-3">
                  <div className="grid grid-cols-3">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-[10px] sm:text-sm font-medium">Secure Payment</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        {isRestaurant ? (
                          <UtensilsCrossed className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <p className="text-[10px] sm:text-sm font-medium">
                        {isRestaurant ? "Fresh Food" : "Fast Delivery"}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                        <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-[10px] sm:text-sm font-medium">Quality Guaranteed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedContainer>
          </div>

          {/* ── RIGHT: Info ───────────────────────────────────────────────── */}
          <div className="lg:max-w-[600px] mx-auto w-full">
            <AnimatedContainer animation="slideUp" className="space-y-3">
              {/* Store Badge */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {store.logo_url ? (
                      <Image
                        src={store.logo_url}
                        alt={store.name}
                        width={48}
                        height={48}
                        className="rounded-xl object-cover h-12"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        {isRestaurant ? (
                          <UtensilsCrossed className="h-6 w-6 text-primary" />
                        ) : (
                          <StoreIcon className="h-6 w-6 text-primary" />
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {isRestaurant ? "Prepared by" : "Sold by"}
                      </p>
                      <p className="font-semibold">{store.name}</p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Title & Rating */}
              <div>
                <h1 className="text-xl lg:text-2xl font-bold leading-tight mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < 4 ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground fill-muted-foreground/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                  <Separator orientation="vertical" className="h-5" />
                  <span className="text-sm text-muted-foreground">24 reviews</span>
                  <Separator orientation="vertical" className="h-5" />
                  <span className="text-sm text-muted-foreground">156 sold</span>
                </div>

                {/* Price */}
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between relative">
                      <div>
                        <div className="flex items-baseline gap-6">
                          <span className="text-2xl font-bold text-primary">
                            {formatAmount(currentPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xl text-muted-foreground line-through">
                              {formatAmount(product.compare_at_price!)}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                            You save {formatAmount(product.compare_at_price! - product.price)}
                          </p>
                        )}
                        {/* Modifier additions summary */}
                        <AnimatePresence>
                          {modifierPriceAddition > 0 && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-xs text-[#e1a200] font-medium mt-1"
                            >
                              Includes +{formatAmount(modifierPriceAddition)} in add-ons
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                      {hasDiscount && (
                        <Badge className="bg-gradient-to-r from-red-600 to-red-500 text-white text-sm right-0 shadow-lg absolute top-0">
                          -{discountPercentage}%
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* ── VARIANTS (non-restaurant only) ─────────────────────── */}
              {!isRestaurant && product.hasVariants && parsedVariants && parsedVariants.length > 0 && (
                <Card className="border-2 overflow-hidden">
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {/* Color */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm sm:text-lg">Select Color</h3>
                      </div>
                      <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-2">
                        <div className="flex gap-2 sm:gap-3 min-w-max">
                          {parsedVariants.map((variant) => (
                            <motion.button
                              key={variant._id || variant.color.name}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedColor(variant.color.name);
                                if (variant.sizes.length > 0) setSelectedSize(variant.sizes[0].size);
                              }}
                              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border-2 transition-all flex-shrink-0 ${
                                selectedColor === variant.color.name
                                  ? "border-[#e1a200] bg-[#e1a200]/10 ring-1 ring-[#e1a200]/30"
                                  : "border-border hover:border-[#e1a200]/50"
                              }`}
                            >
                              <div
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-muted-foreground/30 flex-shrink-0"
                                style={{ backgroundColor: variant.color.hex }}
                              />
                              <span className="font-medium text-xs sm:text-sm whitespace-nowrap">
                                {variant.color.name}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Size */}
                    {selectedColor && availableSizes.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-sm sm:text-lg">Select Size</h3>
                        </div>
                        <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-2">
                          <div className="flex gap-2 sm:gap-3 min-w-max">
                            {availableSizes.map((sizeData) => (
                              <motion.button
                                key={sizeData.size}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedSize(sizeData.size)}
                                disabled={sizeData.quantity === 0}
                                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl border-2 font-medium transition-all flex-shrink-0 ${
                                  selectedSize === sizeData.size
                                    ? "border-[#e1a200] bg-[#e1a200]/10 text-primary ring-1 ring-[#e1a200]/30"
                                    : sizeData.quantity === 0
                                    ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                    : "border-border hover:border-[#e1a200]/50"
                                }`}
                              >
                                <span className="text-sm sm:text-base">{sizeData.size}</span>
                                {sizeData.quantity === 0 && (
                                  <span className="block text-[10px] sm:text-xs">Out of stock</span>
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── MODIFIERS (restaurant only) ────────────────────────── */}
              <AnimatePresence>
                {showModifiers && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ModifierSection
                      groups={parsedModifierGroups}
                      selections={modifierSelections}
                      onToggle={handleModifierToggle}
                      formatAmount={formatAmount}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stock Status */}
              <Card
                className={`border-2 ${
                  currentStock > 0
                    ? "border-green-200 bg-green-50 dark:bg-green-950/20"
                    : "border-red-200 bg-red-50 dark:bg-red-950/20"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        currentStock > 0
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                          : "bg-red-100 text-red-600 dark:bg-red-900/30"
                      }`}
                    >
                      {currentStock > 0 ? <Check className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      {currentStock > 0 ? (
                        <>
                          <p className="font-semibold text-green-900 dark:text-green-100">
                            {isRestaurant ? "Available" : "In Stock"}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {isRestaurant
                              ? `${currentStock} portions available`
                              : `${currentStock} units available${
                                  product.hasVariants && selectedColor && selectedSize
                                    ? ` (${selectedColor} - ${selectedSize})`
                                    : ""
                                }`}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-red-900 dark:text-red-100">
                            {isRestaurant ? "Not Available" : "Out of Stock"}
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {isRestaurant
                              ? "This item is currently unavailable"
                              : product.hasVariants && selectedColor && selectedSize
                              ? `This variant (${selectedColor} - ${selectedSize}) is currently unavailable`
                              : "Currently unavailable"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quantity & Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 rounded-xl overflow-hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-none hover:bg-primary/10"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="w-16 text-center font-semibold text-lg">{quantity}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-none hover:bg-primary/10"
                      onClick={incrementQuantity}
                      disabled={quantity >= currentStock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    className="flex-1 h-12 text-base font-semibold rounded-xl shadow-lg"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || currentStock === 0}
                  >
                    {isAddingToCart ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Adding...
                      </>
                    ) : currentStock === 0 ? (
                      isRestaurant ? "Not Available" : "Out of Stock"
                    ) : (
                      <>
                        {isRestaurant ? (
                          <UtensilsCrossed className="mr-2 h-5 w-5" />
                        ) : (
                          <ShoppingCart className="mr-2 h-5 w-5" />
                        )}
                        {isRestaurant ? "Order Now" : "Add to Cart"}
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl border-2 bg-transparent"
                    onClick={toggleWishlist}
                  >
                    <Heart
                      className={`mr-2 h-5 w-5 transition-colors ${
                        isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    {isInWishlist(product.id) ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" className="h-12 rounded-xl border-2 bg-transparent">
                    <Share2 className="mr-2 h-5 w-5" />
                    Share
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Tabs */}
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="w-full h-12 rounded-xl">
                  <TabsTrigger value="description" className="flex-1 rounded-lg">Description</TabsTrigger>
                  <TabsTrigger value="details" className="flex-1 rounded-lg">Details</TabsTrigger>
                  <TabsTrigger value="shipping" className="flex-1 rounded-lg">
                    {isRestaurant ? "Delivery" : "Shipping"}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="pt-6">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <ExpandableText
                        text={product.description || "No description available for this product."}
                        limit={100}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="details" className="pt-6">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between py-3 border-b">
                        <span className="font-medium flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          SKU
                        </span>
                        <span className="text-muted-foreground font-mono">SKU-{product.id.slice(0, 8)}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="font-medium flex items-center gap-2">
                          <StoreIcon className="h-4 w-4 text-primary" />
                          {isRestaurant ? "Restaurant" : "Store"}
                        </span>
                        <span className="text-muted-foreground">{store.name}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          {isRestaurant ? "Portions" : "Stock"}
                        </span>
                        <Badge variant="secondary">{currentStock} {isRestaurant ? "available" : "units"}</Badge>
                      </div>
                      {!isRestaurant && product.hasVariants && (
                        <div className="flex justify-between py-3 border-b">
                          <span className="font-medium">Variants</span>
                          <Badge variant="secondary">{parsedVariants?.length || 0} colors available</Badge>
                        </div>
                      )}
                      {isRestaurant && showModifiers && (
                        <div className="flex justify-between py-3 border-b">
                          <span className="font-medium flex items-center gap-2">
                            <ChefHat className="h-4 w-4 text-primary" />
                            Customisations
                          </span>
                          <Badge variant="secondary">{parsedModifierGroups.length} options</Badge>
                        </div>
                      )}
                      <div className="flex justify-between py-3">
                        <span className="font-medium flex items-center gap-2">
                          <BadgeCheck className="h-4 w-4 text-primary" />
                          Category
                        </span>
                        <span className="text-muted-foreground">{product.category_id || "Uncategorized"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="shipping" className="pt-6">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 space-y-6">
                      <Separator />
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg mb-1">
                            {isRestaurant ? "Preparation Time" : "Fast Delivery"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isRestaurant
                              ? "Estimated preparation: 15–30 minutes"
                              : "Estimated delivery: 24 hours"}
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg mb-1">Track Your Order</p>
                          <p className="text-sm text-muted-foreground">
                            Real-time tracking available after {isRestaurant ? "dispatch" : "dispatch"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </AnimatedContainer>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <AnimatedContainer animation="fadeIn" delay={0.3} className="mt-20">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">You might also like</h2>
              <p className="text-muted-foreground">More great {isRestaurant ? "dishes" : "products"} from {store.name}</p>
            </div>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-auto-fill">
              {relatedProducts.map((relatedProduct) => (
                <motion.div key={relatedProduct.id} whileHover={{ y: -8 }} transition={{ duration: 0.2 }}>
                  <Card
                    className="overflow-hidden h-full flex flex-col cursor-pointer border-1 hover:border-primary/50 hover:shadow-sm transition-all"
                    onClick={() => router.push(`/stores/${store.slug}/products/${relatedProduct.id}`)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <Image
                        src={relatedProduct.images[0]?.url || "/placeholder.svg"}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover transition-transform hover:scale-110 duration-300"
                      />
                    </div>
                    <CardContent className="p-4 flex-1">
                      <h3 className="font-semibold text-base line-clamp-1 mb-2">{relatedProduct.name}</h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-primary">{formatAmount(relatedProduct.price)}</span>
                        {relatedProduct.compare_at_price && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {formatAmount(relatedProduct.compare_at_price)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatedContainer>
        )}
      </div>
    </div>
  );
}