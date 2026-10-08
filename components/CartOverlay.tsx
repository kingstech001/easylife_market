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
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";

const WHATSAPP_ORDER_NUMBER = "2348071427831";

type CartOverlayProps = {
  onClose: () => void;
};

// Add-ons the customer picked on the product page (soup, meat, fish, etc.).
// item.price already includes their cost, so this is for display only.
type CartModifierGroup = {
  groupName: string;
  options: { name: string; priceAdjustment?: number }[];
};

function getModifierGroups(item: unknown): CartModifierGroup[] {
  const raw = (item as { selectedModifiers?: unknown }).selectedModifiers;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (group): group is CartModifierGroup =>
      !!group &&
      typeof group === "object" &&
      Array.isArray((group as CartModifierGroup).options) &&
      (group as CartModifierGroup).options.length > 0,
  );
}

function sumAdjustments(group: CartModifierGroup): number {
  return group.options.reduce((sum, o) => sum + (o.priceAdjustment ?? 0), 0);
}

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

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

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

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  // Auto-close overlay when cart becomes empty
  useEffect(() => {
    if (isMounted && items.length === 0 && itemCount === 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [items.length, itemCount, isMounted, handleClose]);

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

    try {
      const storeIds = [
        ...new Set(items.map((item) => item.storeId).filter(Boolean)),
      ];
      const productIds = [
        ...new Set(items.map((item) => item.productId).filter(Boolean)),
      ];
      const params = new URLSearchParams();
      if (storeIds.length > 0) params.set("ids", storeIds.join(","));
      if (productIds.length > 0)
        params.set("productIds", productIds.join(","));

      let stores: Array<{ storeId: string; name: string }> = [];
      let productStoreMap: Record<string, string> = {};
      try {
        const response = await fetch(
          `/api/stores/coordinates?${params.toString()}`,
        );
        if (!response.ok) throw new Error("Could not load store names");
        const data = await response.json();
        stores = data.stores || [];
        productStoreMap = data.productStoreMap || {};
      } catch (error) {
        console.error("Failed to load store names for WhatsApp order:", error);
      }

      const storeNames = new Map(
        stores.map((store) => [store.storeId, store.name]),
      );
      const groupedItems = new Map<string, typeof items>();
      items.forEach((item) => {
        const resolvedStoreId = storeNames.has(item.storeId)
          ? item.storeId
          : productStoreMap[item.productId] || item.storeId;
        const storeName = storeNames.get(resolvedStoreId) || "Store";
        groupedItems.set(storeName, [
          ...(groupedItems.get(storeName) || []),
          item,
        ]);
      });

      const itemLines = Array.from(groupedItems.entries()).flatMap(
        ([storeName, storeItems]) => [
          `*${storeName}*`,
          ...storeItems.map((item) => {
            const variantDetails = [
              item.selectedVariant?.color?.name,
              item.selectedVariant?.size
                ? `Size: ${item.selectedVariant.size}`
                : null,
            ].filter(Boolean);
            const variantText =
              variantDetails.length > 0 ? ` (${variantDetails.join(", ")})` : "";

            const addOnLines = getModifierGroups(item).map((group) => {
              const options = group.options
                .map((option) => {
                  const adjustment = option.priceAdjustment ?? 0;
                  if (!adjustment) return option.name;
                  const sign = adjustment > 0 ? "+" : "-";
                  return `${option.name} (${sign}${formatAmount(Math.abs(adjustment))})`;
                })
                .join(", ");
              return `   + ${group.groupName}: ${options}`;
            });

            return [
              `${item.quantity} × ${item.name}${variantText} — ${formatAmount(item.price * item.quantity)}`,
              ...addOnLines,
            ].join("\n");
          }),
          "",
        ],
      );
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
    } catch (error) {
      console.error("WhatsApp checkout failed:", error);
      orderWindow.close();
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsOpeningWhatsApp(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
          isVisible ? "opacity-100" : "opacity-0",
        )}
        onClick={handleClose}
      />

      {/* Cart Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={cn(
          "fixed inset-y-0 right-0 z-[60] flex h-full w-full max-w-md flex-col overflow-hidden border-l bg-background shadow-2xl sm:rounded-l-3xl",
          "transition-transform duration-300 ease-out",
          isVisible ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div className="leading-tight">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Your cart
              </h2>
              <p className="text-xs text-muted-foreground">
                {itemCount > 0
                  ? `${itemCount} ${itemCount === 1 ? "item" : "items"}`
                  : "No items yet"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close cart"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Cart Items */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <ShoppingBag className="h-9 w-9 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">Your cart is empty</h3>
              <p className="mb-6 max-w-xs text-sm text-muted-foreground">
                Looks like you haven&apos;t added anything yet. Start exploring
                and find something you love.
              </p>
              <Button className="rounded-xl px-6" onClick={handleClose}>
                Continue shopping
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item) => {
                const itemKey = getCartItemKey(
                  item.id,
                  item.selectedVariant,
                  item.selectedModifiers,
                );

                return (
                  <li key={itemKey} className="flex gap-4 py-5">
                    {/* Product Image */}
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-muted ring-1 ring-border">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name} from cart`}
                          onClick={() => removeFromCart(item.id, itemKey)}
                          className="-mr-1 -mt-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {item.selectedVariant &&
                        (item.selectedVariant.color ||
                          item.selectedVariant.size) && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {item.selectedVariant.color && (
                              <Badge
                                variant="secondary"
                                className="gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                              >
                                <span
                                  className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
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
                                variant="secondary"
                                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                              >
                                Size {item.selectedVariant.size}
                              </Badge>
                            )}
                          </div>
                        )}

                      {/* Add-ons (e.g. soup, meat, fish) */}
                      {getModifierGroups(item).length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {getModifierGroups(item).map((group) => {
                            const extra = sumAdjustments(group);
                            return (
                              <li
                                key={group.groupName}
                                className="flex items-start justify-between gap-2"
                              >
                                <span className="min-w-0">
                                  <span className="font-medium text-foreground/80">
                                    {group.groupName}:
                                  </span>{" "}
                                  {group.options.map((o) => o.name).join(", ")}
                                </span>
                                {extra !== 0 && (
                                  <span className="shrink-0 tabular-nums">
                                    {extra > 0 ? "+" : "-"}
                                    {formatAmount(Math.abs(extra))}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      <div className="mt-auto flex items-end justify-between pt-3">
                        {/* Quantity Controls */}
                        <div className="inline-flex items-center rounded-full border bg-background">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity - 1,
                                itemKey,
                              )
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span
                            className="min-w-[1.75rem] text-center text-sm font-semibold tabular-nums"
                            aria-live="polite"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1,
                                itemKey,
                              )
                            }
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm font-bold tabular-nums text-foreground">
                            {formatAmount(item.price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                              {formatAmount(item.price)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <footer className="space-y-3 border-t bg-background/95 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)] backdrop-blur">
            {/* Summary */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span className="tabular-nums">{formatAmount(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-baseline justify-between">
                <span className="text-base font-semibold">Total</span>
                <span className="text-2xl font-bold tabular-nums text-primary">
                  {formatAmount(subtotal)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link href="/checkout" onClick={handleClose} className="block">
              <Button
                className="group h-12 w-full rounded-xl text-base font-semibold shadow-md transition-all active:scale-[0.98]"
                size="lg"
              >
                Proceed to checkout
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
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
              className="h-12 w-full rounded-xl bg-[#25D366] text-base font-semibold text-white shadow-md transition-all hover:bg-[#1ebe5d] active:scale-[0.98]"
              size="lg"
              disabled={isOpeningWhatsApp}
            >
              {isOpeningWhatsApp ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <FaWhatsapp className="mr-2 h-5 w-5" />
              )}
              {isOpeningWhatsApp
                ? "Preparing your order..."
                : "Complete order on WhatsApp"}
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
              Availability and final delivery fee are confirmed on WhatsApp.
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}