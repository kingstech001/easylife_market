'use client'

import { useCart } from "@/context/cart-context"
import Image from "next/image"
import { Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import Link from "next/link"

type CartOverlayProps = {
    onClose: () => void
}

export default function CartOverlay({ onClose }: CartOverlayProps) {
    const { state, dispatch } = useCart()
    const [isMounted, setIsMounted] = useState(false)
    const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) return null

    const total = state.items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
            <div className="bg-background w-full max-w-md h-full shadow-xl border-l p-4 overflow-y-auto relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center mb-4 gap-2">
                    <h2 className="text-2xl font-bold  text-foreground">Your Cart</h2>
                    {itemCount > 0 && (
                        <span className="bg-destructive text-white text-xs w-5 h-5 p-4 rounded-full flex items-center justify-center text-[20px]">
                            {itemCount}
                        </span>
                    )}
                </div>
                {state.items.length === 0 ? (
                    <div>
                        <p className="text-muted-foreground">Your cart is empty.</p>
                        <Button className="mt-4" onClick={onClose}>Continue Shopping</Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 pb-24">
                            {state.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start justify-between border rounded-lg p-3"
                                >
                                    <div className="flex items-center gap-4">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            width={60}
                                            height={60}
                                            className="rounded"
                                        />
                                        <div>
                                            <h3 className="font-semibold text-foreground">{item.name}</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <div className="flex items-center border rounded px-2">
                                                    <button
                                                        className="text-lg px-2 text-foreground"
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
                                                        -
                                                    </button>
                                                    <span className="px-2">{item.quantity}</span>
                                                    <button
                                                        className="text-lg px-2 text-foreground"
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
                                                        +
                                                    </button>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    className="text-destructive hover:text-red-700 p-0"
                                                    onClick={() =>
                                                        dispatch({ type: "REMOVE_ITEM", payload: item.id })
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="absolute bottom-0 left-0 w-full bg-background border-t p-4">
                            <p className="text-xl font-semibold text-foreground">Total: ${total.toFixed(2)}</p>
                            <Link href="/checkout">
                                <Button className="mt-2 w-full" onClick={onClose}>Checkout</Button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

