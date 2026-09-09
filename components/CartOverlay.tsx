"use client";

import { useCart } from "@/context/cart-context";
import Image from "next/image";
import {
  Trash2,
  X,
  ShoppingBag,
  Minus,
  Plus,
  ArrowRight,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";

const WHATSAPP_ORDER_NUMBER = "2348071427831";

type CartOverlayProps = {
  onClose: () => void;
};

export default function CartOverlay({ onClose }: CartOverlayProps) {
  const {
    items = [],
    removeFromCart,
    updateQuantity,
    getCartItemKey,
  } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isOpeningWhatsApp, setIsOpeningWhatsApp] = useState(false);
  const itemCount = items.reduce(
    (sum: number, item: { quantity: number }) => sum + item.quantity,
    0,
  );
  const { formatAmount } = useFormatAmount();

  useEffect(() => {
    setIsMounted(true);
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Auto-close overlay when cart becomes empty
  useEffect(() => {
    if (isMounted && items.length === 0 && itemCount === 0) {
      // Small delay to allow user to see the empty state briefly
      const timer = setTimeout(() => {
        handleClose();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [items.length, itemCount, isMounted]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isMounted) return null;

  const subtotal = items.reduce(
    (acc: number, item: { price: number; quantity: number }) =>
      acc + item.price * item.quantity,
    0,
  );

  const handleWhatsAppCheckout = async () => {
    const orderWindow = window.open("", "_blank");
    if (!orderWindow) {
      toast.error("Please allow pop-ups to continue your order on WhatsApp.");
      return;
    }
    orderWindow.opener = null;
    setIsOpeningWhatsApp(true);

    const storeIds = [...new Set(items.map((item) => item.storeId).filter(Boolean))];
    const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean))];
    const params = new URLSearchParams();
    if (storeIds.length > 0) params.set("ids", storeIds.join(","));
    if (productIds.length > 0) params.set("productIds", productIds.join(","));

    let stores: Array<{ storeId: string; name: string }> = [];
    let productStoreMap: Record<string, string> = {};
    try {
      const response = await fetch(`/api/stores/coordinates?${params.toString()}`);
      if (!response.ok) throw new Error("Could not load store names");
      const data = await response.json();
      stores = data.stores || [];
      productStoreMap = data.productStoreMap || {};
    } catch (error) {
      console.error("Failed to load store names for WhatsApp order:", error);
    }

    const storeNames = new Map(stores.map((store) => [store.storeId, store.name]));
    const groupedItems = new Map<string, typeof items>();
    items.forEach((item) => {
      const resolvedStoreId = storeNames.has(item.storeId)
        ? item.storeId
        : productStoreMap[item.productId] || item.storeId;
      const storeName = storeNames.get(resolvedStoreId) || "Store";
      groupedItems.set(storeName, [...(groupedItems.get(storeName) || []), item]);
    });

    const itemLines = Array.from(groupedItems.entries()).flatMap(([storeName, storeItems]) => [
      `*${storeName}*`,
      ...storeItems.map((item) => {
        const variantDetails = [
          item.selectedVariant?.color?.name,
          item.selectedVariant?.size ? `Size: ${item.selectedVariant.size}` : null,
        ].filter(Boolean);
        const variantText = variantDetails.length > 0
          ? ` (${variantDetails.join(", ")})`
          : "";

        return `${item.quantity} × ${item.name}${variantText} — ${formatAmount(item.price * item.quantity)}`;
      }),
      "",
    ]);
    const message = [
      "Hello EasyLife, I would like to order:",
      "",
      ...itemLines,
      "",
      `Subtotal: ${formatAmount(subtotal)}`,
      "Delivery address: ......................................................",
      "",
      "Please confirm product availability and the final delivery fee.",
    ].join("\n");

    orderWindow.location.href = `https://wa.me/${WHATSAPP_ORDER_NUMBER}?text=${encodeURIComponent(message)}`;
    setIsOpeningWhatsApp(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out",
          isVisible ? "opacity-100" : "opacity-0",
        )}
        onClick={handleClose}
      />

      {/* Cart Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[60] bg-background w-full max-w-lg h-full shadow-2xl border-l overflow-hidden flex flex-col",
          "transition-transform duration-300 ease-out",
          isVisible ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="relative p-6 border-b bg-primary/10">
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-background rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Shopping Cart
              </h2>
              {itemCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex justify-center overflow-y-auto p-2 h-[50%]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="p-3 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Looks like you haven't added anything to your cart yet
              </p>
              <Button className="rounded-xl p-4" onClick={handleClose} size="lg">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4 w-full">
              {items.map((item) => {
                const itemKey = getCartItemKey(item.id, item.selectedVariant);

                return (
                  <Card
                    key={itemKey}
                    className="border-2 hover:border-primary/50 transition-all overflow-hidden p-0"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Product Image */}
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="items-start justify-between gap-2 mb-2">
                            <div className=" flex flex-1 min-w-0 items-center justify-between">
                              <h3 className="font-semibold text-foreground line-clamp-1 leading-tight">
                                {item.name}
                              </h3>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-red-700 hover:bg-destructive/10 h-8 w-8 rounded-lg flex-shrink-0"
                                onClick={() => removeFromCart(item.id, itemKey)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {/* Display variant info if available */}
                            {item.selectedVariant &&
                              (item.selectedVariant.color ||
                                item.selectedVariant.size) && (
                                <div className="flex gap-1 mt-1">
                                  {item.selectedVariant.color && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      <div
                                        className="w-2 h-2 rounded-full mr-1"
                                        style={{
                                          backgroundColor:
                                            item.selectedVariant.color.hex,
                                        }}
                                      />
                                      {item.selectedVariant.color.name}
                                    </Badge>
                                  )}
                                  {item.selectedVariant.size && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Size: {item.selectedVariant.size}
                                    </Badge>
                                  )}
                                </div>
                              )}
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center border-2 rounded-lg overflow-hidden">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none hover:bg-primary/10"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.quantity - 1,
                                    itemKey,
                                  )
                                }
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="px-3 text-sm font-semibold min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none hover:bg-primary/10"
                                onClick={() =>
                                  updateQuantity(
                                    item.id,
                                    item.quantity + 1,
                                    itemKey,
                                  )
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary">
                                {formatAmount(item.price * item.quantity)}
                              </p>

                              {item.quantity > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  {formatAmount(item.price)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t bg-background p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] space-y-4">
            {/* Price Breakdown */}
            <Card className="border-0 shadow-sm bg-muted/50 mb-2">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatAmount(subtotal)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Checkout Button */}
            <Link href="/checkout" onClick={handleClose}>
              <Button
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg"
                size="lg"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <div className="flex items-center gap-3" aria-hidden="true">
              <Separator className="flex-1" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Or
              </span>
              <Separator className="flex-1" />
            </div>

            <Button
              type="button"
              onClick={handleWhatsAppCheckout}
              className="h-12 w-full rounded-xl bg-[#25D366] text-base font-semibold text-white shadow-lg transition-all hover:bg-[#1ebe5d] active:scale-[0.98]"
              size="lg"
              disabled={isOpeningWhatsApp}
            >
              <FaWhatsapp className="mr-2 h-5 w-5" />
              {isOpeningWhatsApp ? "Preparing your order..." : "Complete order on WhatsApp"}
            </Button>
            <p className="text-center text-[10px] leading-relaxed text-muted-foreground sm:text-xs">
              Availability and the final delivery fee will be confirmed on WhatsApp.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
