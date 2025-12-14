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

type CartOverlayProps = {
  onClose: () => void;
};

export default function CartOverlay({ onClose }: CartOverlayProps) {
  const { state, dispatch } = useCart();
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
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
    if (isMounted && state.items.length === 0 && itemCount === 0) {
      // Small delay to allow user to see the empty state briefly
      const timer = setTimeout(() => {
        handleClose();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [state.items.length, itemCount, isMounted]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isMounted) return null;

  const subtotal = state.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Cart Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 bg-background w-full max-w-lg h-full shadow-2xl border-l overflow-hidden flex flex-col",
          "transition-transform duration-300 ease-out",
          isVisible ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="relative p-6 border-b bg-gradient-to-br from-primary/5 to-primary/10">
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
        <div className="flex-1 overflow-y-auto p-6">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Looks like you haven't added anything to your cart yet
              </p>
              <Button className="rounded-xl" onClick={handleClose} size="lg">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {state.items.map((item) => (
                <Card
                  key={item.id}
                  className="border-2 hover:border-primary/50 transition-all overflow-hidden"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
                            {item.name}
                          </h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-red-700 hover:bg-destructive/10 h-8 w-8 rounded-lg flex-shrink-0"
                            onClick={() =>
                              dispatch({
                                type: "REMOVE_ITEM",
                                payload: item.id,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity Controls */}
                          <div className="flex items-center border-2 rounded-lg overflow-hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none hover:bg-primary/10"
                              onClick={() =>
                                dispatch({
                                  type: "UPDATE_QUANTITY",
                                  payload: {
                                    id: item.id,
                                    quantity: item.quantity - 1,
                                  },
                                })
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
                                dispatch({
                                  type: "UPDATE_QUANTITY",
                                  payload: {
                                    id: item.id,
                                    quantity: item.quantity + 1,
                                  },
                                })
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
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
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t bg-gradient-to-br from-background to-muted/20 p-6 space-y-4">
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
          </div>
        )}
      </div>
    </>
  );
}