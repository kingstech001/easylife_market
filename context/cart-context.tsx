"use client"

import type React from "react"
import { createContext, useContext, useReducer, type ReactNode, useEffect, useRef } from "react"
import { toast } from "sonner"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  storeId: string
  productId: string
}

interface CartState {
  items: CartItem[]
}

type Action =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "SET_CART"; payload: CartItem[] }
  | { type: "CLEAR_CART" }

const CART_STORAGE_KEY = "cart"

const initialState: CartState = {
  items: [],
}

function cartReducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find((item) => item.id === action.payload.id)
      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.payload.id ? { ...item, quantity: item.quantity + action.payload.quantity } : item,
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, action.payload],
      }
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      }
    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.id !== action.payload.id),
        }
      }
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item,
        ),
      }
    }
    case "SET_CART":
      return {
        ...state,
        items: action.payload,
      }
    case "CLEAR_CART":
      console.log('🗑️ Cart cleared - all items removed')
      return {
        ...state,
        items: [],
      }
    default:
      return state
  }
}

type CartContextType = {
  items: CartItem[]
  state: CartState
  dispatch: React.Dispatch<Action>
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: (silent?: boolean) => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const saveTimeout = useRef<number | undefined>(undefined)

  // Load from localStorage on mount (client only)
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        dispatch({ type: "SET_CART", payload: parsed })
        console.log('📦 Cart loaded from localStorage:', parsed.length, 'items')
      }
    } catch (err) {
      console.warn("Failed to restore cart from localStorage:", err)
      // Remove corrupted data
      try {
        localStorage.removeItem(CART_STORAGE_KEY)
      } catch (e) {
        // Ignore if can't remove
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist cart to localStorage when it changes (debounced small delay)
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      // debounce to avoid too-frequent writes when user updates rapidly
      if (saveTimeout.current) {
        window.clearTimeout(saveTimeout.current)
      }
      saveTimeout.current = window.setTimeout(() => {
        try {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items))
          console.log('💾 Cart saved to localStorage:', state.items.length, 'items')
        } catch (e) {
          console.warn("Failed to save cart to localStorage:", e)
        }
      }, 200)
    } catch (err) {
      console.warn("Unable to persist cart:", err)
    }

    return () => {
      if (saveTimeout.current) {
        window.clearTimeout(saveTimeout.current)
      }
    }
  }, [state.items])

  const addToCart = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    // Guard: Ensure storeId and productId are present
    if (!item.storeId || !item.productId) {
      toast.error("Cannot add to cart: Missing store or product information.")
      return
    }
    const cartItem: CartItem = {
      ...item,
      quantity: item.quantity || 1,
    }
    dispatch({ type: "ADD_ITEM", payload: cartItem })
    toast.success(`${item.name} added to cart`, {
      action: {
        label: "View Cart",
        onClick: () => {
          window.location.href = "/cart"
        },
      },
    })
  }

  const removeFromCart = (id: string) => {
    const item = state.items.find((item) => item.id === id)
    dispatch({ type: "REMOVE_ITEM", payload: id })
    if (item) {
      toast(`${item.name} removed from cart`)
    }
  }

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } })
  }

  const clearCart = (silent = false) => {
    console.log('🧹 clearCart() called - dispatching CLEAR_CART action')
    dispatch({ type: "CLEAR_CART" })
    
    // Immediately clear from localStorage
    try {
      localStorage.removeItem(CART_STORAGE_KEY)
      console.log('✅ Cart cleared from localStorage')
    } catch (e) {
      console.warn("Failed to clear cart from localStorage:", e)
    }
    
    // Only show toast if not silent (e.g., manual clear vs. after payment)
    if (!silent) {
      toast.success("Cart cleared")
    }
  }

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        state,
        dispatch,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}