"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Plus } from "lucide-react"
import { useCart } from "@/context/cart-context"
import Link from "next/link"
import Image from "next/image"

export function CartSummaryWidget() {
  const { items: cartItems, getTotalItems, getTotalPrice, removeFromCart } = useCart()
  const cartTotal = getTotalItems()
  const cartValue = getTotalPrice()

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
            Your Cart <span className="bg-[#c0a146] text-xs w-5 h-5 p-4 rounded-full flex items-center justify-center text-[20px]">{cartTotal}</span>
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/cart">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cartItems.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                  <Image
                    src={item.image || "/placeholder.svg?height=48&width=48"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none line-clamp-1">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">₦{(item.price * item.quantity).toFixed(2)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromCart(item.id)}
                  className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            </div>
          ))}
          {cartItems.length > 3 && (
            <p className="text-sm text-muted-foreground text-center">+{cartItems.length - 3} more items in cart</p>
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
