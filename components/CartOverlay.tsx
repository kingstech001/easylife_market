"use client";

import { useCart } from "@/context/cart-context";
import Image from "next/image";
import {
  ChevronDown,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useFormatAmount } from "@/hooks/useFormatAmount";
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

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A43]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// Add-ons for one cart line. A single add-on is shown inline; two or more
// collapse behind a toggle, so a long list can't make the cart item tall.
function AddOnsList({
  groups,
  formatAmount,
}: {
  groups: CartModifierGroup[];
  formatAmount: (amount: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const count = groups.reduce((n, g) => n + g.options.length, 0);
  const totalExtra = groups.reduce((n, g) => n + sumAdjustments(g), 0);

  const list = (
    <ul className="space-y-0.5">
      {groups.map((group) => {
        const extra = sumAdjustments(group);
        return (
          <li
            key={group.groupName}
            className="flex items-start justify-between gap-2"
          >
            <span className="min-w-0">
              <span className="text-foreground/80">{group.groupName}:</span>{" "}
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
  );

  if (count <= 1) {
    return <div className="mt-1.5 text-xs text-muted-foreground">{list}</div>;
  }

  return (
    <div className="mt-1.5 text-xs text-muted-foreground">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded py-0.5 text-left transition-colors hover:text-foreground",
          focusRing,
        )}
      >
        <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
          Add-ons ({count})
        </span>
        {totalExtra !== 0 && (
          <span className="shrink-0 tabular-nums">
            {totalExtra > 0 ? "+" : "-"}
            {formatAmount(Math.abs(totalExtra))}
          </span>
        )}
      </button>

      {/* Smooth open/close: animate the grid row between 0fr and 1fr */}
      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden" aria-hidden={!open}>
          <div className="pl-[1.125rem] pt-1.5">{list}</div>
        </div>
      </div>
    </div>
  );
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
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
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

    // Lock page scroll while open, then put it back exactly as it was
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the cart, and give it back to whatever opened it
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
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
          "fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ease-out",
          isVisible ? "opacity-100" : "opacity-0",
        )}
        onClick={handleClose}
      />

      {/* Cart panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className={cn(
          "fixed inset-y-0 right-0 z-[60] flex h-full w-full max-w-[26rem] flex-col bg-background shadow-2xl sm:border-l sm:border-border",
          "transition-transform duration-300 ease-out",
          isVisible ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id="cart-title" className="text-base font-semibold tracking-tight">
            Cart
            {itemCount > 0 && (
              <span className="ml-1.5 font-normal text-muted-foreground">
                ({itemCount})
              </span>
            )}
          </h2>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close cart"
            className={cn(
              "-mr-2 flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              focusRing,
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Items */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-base font-semibold">Your cart is empty</h3>
              <p className="mb-6 max-w-xs text-sm text-muted-foreground">
                Browse the stores and add something you like. It will show up
                here.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-lg bg-[#0E5A43] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#083B2D]",
                  focusRing,
                )}
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => {
                const itemKey = getCartItemKey(
                  item.id,
                  item.selectedVariant,
                  item.selectedModifiers,
                );
                const addOns = getModifierGroups(item);
                const color = item.selectedVariant?.color;
                const size = item.selectedVariant?.size;

                return (
                  <li key={itemKey} className="flex gap-4 py-5">
                    {/* Image */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                          {item.name}
                        </h3>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                          {formatAmount(item.price * item.quantity)}
                        </p>
                      </div>

                      {item.quantity > 1 && (
                        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                          {formatAmount(item.price)} each
                        </p>
                      )}

                      {(color || size) && (
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          {color && (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                aria-hidden
                                className="h-2.5 w-2.5 rounded-full border border-black/15"
                                style={{ backgroundColor: color.hex }}
                              />
                              {color.name}
                            </span>
                          )}
                          {color && size && <span aria-hidden>·</span>}
                          {size && <span>Size {size}</span>}
                        </p>
                      )}

                      {/* Add-ons (e.g. soup, meat, fish) */}
                      {addOns.length > 0 && (
                        <AddOnsList groups={addOns} formatAmount={formatAmount} />
                      )}

                      <div className="mt-auto flex items-center justify-between pt-3">
                        {/* Quantity */}
                        <div
                          className="inline-flex h-8 items-center rounded-md border border-border"
                          role="group"
                          aria-label={`Quantity of ${item.name}`}
                        >
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-l-md text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
                              focusRing,
                            )}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1, itemKey)
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span
                            className="min-w-[2rem] text-center text-sm font-medium tabular-nums"
                            aria-live="polite"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-r-md text-foreground transition-colors hover:bg-muted",
                              focusRing,
                            )}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1, itemKey)
                            }
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          aria-label={`Remove ${item.name} from cart`}
                          onClick={() => removeFromCart(item.id, itemKey)}
                          className={cn(
                            "rounded text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline",
                            focusRing,
                          )}
                        >
                          Remove
                        </button>
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
          <footer className="border-t border-border bg-background px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
            <dl className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </dt>
                <dd className="tabular-nums text-foreground">
                  {formatAmount(subtotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="text-muted-foreground">Calculated at checkout</dd>
              </div>
            </dl>

            <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-base font-semibold">Total</span>
              <span className="text-xl font-semibold tabular-nums">
                {formatAmount(subtotal)}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <Link
                href="/checkout"
                onClick={handleClose}
                className={cn(
                  "inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#0E5A43] text-sm font-semibold text-white transition-colors hover:bg-[#083B2D]",
                  focusRing,
                )}
              >
                Proceed to checkout
              </Link>

              <div
                className="flex items-center gap-3 text-xs text-muted-foreground"
                aria-hidden="true"
              >
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <button
                type="button"
                onClick={handleWhatsAppCheckout}
                disabled={isOpeningWhatsApp}
                className={cn(
                  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70",
                  focusRing,
                )}
              >
                {isOpeningWhatsApp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FaWhatsapp className="h-5 w-5 text-[#25D366]" />
                )}
                {isOpeningWhatsApp
                  ? "Preparing your order..."
                  : "Complete order on WhatsApp"}
              </button>
            </div>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Availability and final delivery fee are confirmed on WhatsApp.
            </p>
          </footer>
        )}
      </aside>
    </>
  );
}