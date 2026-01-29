"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface ISelectedVariant {
  color?: {
    name: string
    hex: string
  }
  size?: string
}

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  storeId: string
  selectedVariant?: ISelectedVariant
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, "selectedVariant"> & { selectedVariant?: ISelectedVariant }) => void
  removeFromCart: (id: string, variantKey?: string) => void
  updateQuantity: (id: string, quantity: number, variantKey?: string) => void
  getTotalPrice: () => number
  getTotalItems: () => number
  clearCart: () => void
  getCartItemKey: (id: string, variant?: ISelectedVariant) => string
  getItemByKey: (key: string) => CartItem | undefined
  updateItemVariant: (id: string, oldVariant: ISelectedVariant | undefined, newVariant: ISelectedVariant | undefined) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "cart_items"

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Generate unique key for cart item considering variants
  const getCartItemKey = (id: string, variant?: ISelectedVariant): string => {
    if (!variant || (!variant.color && !variant.size)) {
      return id
    }
    const colorKey = variant.color?.hex || ""
    const sizeKey = variant.size || ""
    return `${id}-${colorKey}-${sizeKey}`
  }

  // Get cart item by unique key
  const getItemByKey = (key: string): CartItem | undefined => {
    return items.find((item) => getCartItemKey(item.id, item.selectedVariant) === key)
  }

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        const parsedItems = JSON.parse(savedCart)
        setItems(Array.isArray(parsedItems) ? parsedItems : [])
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error)
      localStorage.removeItem(CART_STORAGE_KEY)
      setItems([])
    }
    setIsHydrated(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      } catch (error) {
        console.error("Failed to save cart to localStorage:", error)
      }
    }
  }, [items, isHydrated])

  const addToCart = (newItem: Omit<CartItem, "selectedVariant"> & { selectedVariant?: ISelectedVariant }) => {
    setItems((prevItems) => {
      const itemKey = getCartItemKey(newItem.id, newItem.selectedVariant)
      const existingItemIndex = prevItems.findIndex((item) => getCartItemKey(item.id, item.selectedVariant) === itemKey)

      if (existingItemIndex > -1) {
        // If item already exists with same variant, increase quantity
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
        }
        return updatedItems
      } else {
        // Add new item with variant support
        return [...prevItems, newItem as CartItem]
      }
    })
  }

  const removeFromCart = (id: string, variantKey?: string) => {
    setItems((prevItems) => {
      if (variantKey) {
        // Remove by variant key
        return prevItems.filter((item) => getCartItemKey(item.id, item.selectedVariant) !== variantKey)
      }
      // Remove all items with this product ID
      return prevItems.filter((item) => item.id !== id)
    })
  }

  const updateQuantity = (id: string, quantity: number, variantKey?: string) => {
    if (quantity <= 0) {
      removeFromCart(id, variantKey)
      return
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        const itemKey = getCartItemKey(item.id, item.selectedVariant)
        if (variantKey ? itemKey === variantKey : item.id === id) {
          return { ...item, quantity: Math.max(1, quantity) }
        }
        return item
      })
    )
  }

  const updateItemVariant = (id: string, oldVariant: ISelectedVariant | undefined, newVariant: ISelectedVariant | undefined) => {
    setItems((prevItems) => {
      const oldKey = getCartItemKey(id, oldVariant)
      const newKey = getCartItemKey(id, newVariant)

      // If the new key already exists, merge quantities
      const existingItemIndex = prevItems.findIndex((item) => getCartItemKey(item.id, item.selectedVariant) === newKey)

      if (existingItemIndex > -1) {
        const itemToRemove = prevItems.find((item) => getCartItemKey(item.id, item.selectedVariant) === oldKey)
        if (itemToRemove) {
          const updated = [...prevItems]
          updated[existingItemIndex].quantity += itemToRemove.quantity
          return updated.filter((item) => getCartItemKey(item.id, item.selectedVariant) !== oldKey)
        }
      }

      // Otherwise, just update the variant
      return prevItems.map((item) => {
        if (getCartItemKey(item.id, item.selectedVariant) === oldKey) {
          return { ...item, selectedVariant: newVariant }
        }
        return item
      })
    })
  }

  const getTotalPrice = (): number => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = (): number => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const clearCart = () => {
    setItems([])
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        getTotalPrice,
        getTotalItems,
        clearCart,
        getCartItemKey,
        getItemByKey,
        updateItemVariant,
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
