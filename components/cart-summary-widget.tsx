"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Plus, Trash2 } from "lucide-react"
import { useCart } from "@/context/cart-context"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"

export function CartSummaryWidget() {
  const { items: cartItems, getTotalItems, getTotalPrice, removeFromCart } = useCart()
  const [mounted, setMounted] = useState(false)
  
  const cartTotal = getTotalItems()
  const cartValue = getTotalPrice()

  // Ensure component is mounted before rendering cart data
  useEffect(() => {
    setMounted(true)
  }, [])

  // Force re-render when cartItems change
  useEffect(() => {
    console.log('🛒 Cart Summary Widget - Cart items updated:', cartItems.length)
  }, [cartItems])

  // Don't render cart data until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="animate-pulse">
            <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-4" />
            <div className="h-4 bg-muted rounded w-32 mx-auto mb-2" />
            <div className="h-4 bg-muted rounded w-48 mx-auto" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground mb-4">Add some items to get started</p>
          <Button asChild>
            <Link href="/stores">
              <Plus className="mr-2 h-4 w-4" />
              Start Shopping
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart 
            <span className="bg-[#c0a146] text-white text-xs min-w-[20px] h-5 px-2 rounded-full flex items-center justify-center font-semibold">
              {cartTotal}
            </span>
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/cart">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cartItems.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative h-12 w-12 overflow-hidden rounded-md border flex-shrink-0">
                  <Image
                    src={item.image || "/placeholder.svg?height=48&width=48"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none line-clamp-1">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <p className="text-sm font-medium whitespace-nowrap">₦{(item.price * item.quantity).toFixed(2)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromCart(item.id)}
                  className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {cartItems.length > 3 && (
            <p className="text-sm text-muted-foreground text-center">
              +{cartItems.length - 3} more {cartItems.length - 3 === 1 ? 'item' : 'items'} in cart
            </p>
          )}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="font-medium">Total: ₦{cartValue.toFixed(2)}</span>
            <Button asChild size="sm">
              <Link href="/checkout">Checkout</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}