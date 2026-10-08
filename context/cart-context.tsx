"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface ISelectedVariant {
  color?: {
    name: string
    hex: string
  }
  size?: string
}

// Food add-ons chosen on the product page, e.g.
// { groupName: "Choose your soup", options: [{ name: "Egusi", priceAdjustment: 0 }] }
export interface ISelectedModifier {
  groupName: string
  options: { name: string; priceAdjustment: number }[]
}

export interface CartItem {
  id: string
  productId: string
  name: string
  // Unit price. For food items this ALREADY includes the add-on prices.
  price: number
  quantity: number
  image: string
  storeId: string
  selectedVariant?: ISelectedVariant
  selectedModifiers?: ISelectedModifier[]
}

interface CartContextType {
  items: CartItem[]
  addToCart: (item: Omit<CartItem, "selectedVariant"> & { selectedVariant?: ISelectedVariant }) => void
  removeFromCart: (id: string, variantKey?: string) => void
  updateQuantity: (id: string, quantity: number, variantKey?: string) => void
  getTotalPrice: () => number
  getTotalItems: () => number
  clearCart: () => void
  getCartItemKey: (id: string, variant?: ISelectedVariant, modifiers?: ISelectedModifier[]) => string
  getItemByKey: (key: string) => CartItem | undefined
  updateItemVariant: (id: string, oldVariant: ISelectedVariant | undefined, newVariant: ISelectedVariant | undefined) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "cart_items"

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Generate unique key for cart item considering variants AND food add-ons.
  // Items without add-ons keep their old key, so existing saved carts still work.
  const getCartItemKey = (
    id: string,
    variant?: ISelectedVariant,
    modifiers?: ISelectedModifier[]
  ): string => {
    let key = id
    if (variant && (variant.color || variant.size)) {
      const colorKey = variant.color?.hex || ""
      const sizeKey = variant.size || ""
      key = `${id}-${colorKey}-${sizeKey}`
    }
    if (modifiers && modifiers.length > 0) {
      // Sorted so the same choices always produce the same key
      const modifierKey = modifiers
        .map((group) => `${group.groupName}:${group.options.map((o) => o.name).sort().join("+")}`)
        .sort()
        .join("|")
      key = `${key}~${modifierKey}`
    }
    return key
  }

  // Get cart item by unique key
  const getItemByKey = (key: string): CartItem | undefined => {
    return items.find((item) => getCartItemKey(item.id, item.selectedVariant, item.selectedModifiers) === key)
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
      } catch (error: any) {
        // Handle QuotaExceededError — trim oldest items to make space
        if (error?.name === "QuotaExceededError" && items.length > 1) {
          const trimmed = items.slice(-50)
          try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(trimmed)) } catch {}
          setItems(trimmed)
        }
        console.error("Failed to save cart to localStorage:", error)
      }
    }
  }, [items, isHydrated])

  const MAX_CART_ITEMS = 100

  const addToCart = (newItem: Omit<CartItem, "selectedVariant"> & { selectedVariant?: ISelectedVariant }) => {
    setItems((prevItems) => {
      const itemKey = getCartItemKey(newItem.id, newItem.selectedVariant, newItem.selectedModifiers)
      const existingItemIndex = prevItems.findIndex((item) => getCartItemKey(item.id, item.selectedVariant, item.selectedModifiers) === itemKey)

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
        }
        return updatedItems
      } else {
        if (prevItems.length >= MAX_CART_ITEMS) {
          console.warn("Cart is full, cannot add more items")
          return prevItems
        }
        return [...prevItems, newItem as CartItem]
      }
    })
  }

  const removeFromCart = (id: string, variantKey?: string) => {
    setItems((prevItems) => {
      if (variantKey) {
        // Remove by variant key
        return prevItems.filter((item) => getCartItemKey(item.id, item.selectedVariant, item.selectedModifiers) !== variantKey)
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
        const itemKey = getCartItemKey(item.id, item.selectedVariant, item.selectedModifiers)
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
      const existingItemIndex = prevItems.findIndex((item) => getCartItemKey(item.id, item.selectedVariant, item.selectedModifiers) === newKey)

      if (existingItemIndex > -1) {
        const itemToRemove = prevItems.find((item) => getCartItemKey(item.id, item.selectedVariant, item.selectedModifiers) === oldKey)
        if (itemToRemove) {
          const updated = [...prevItems]
          updated[existingItemIndex].quantity += itemToRemove.quantity
          return updated.filter((item) => getCartItemKey(item.id, item.selectedVariant, item.selectedModifiers) !== oldKey)
        }
      }

      // Otherwise, just update the variant
      return prevItems.map((item) => {
        if (getCartItemKey(item.id, item.selectedVariant, item.selectedModifiers) === oldKey) {
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