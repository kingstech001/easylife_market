"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"

export type WishlistItem = {
  id: string
  name: string
  price: number
  image: string
  storeSlug: string
}

interface State {
  wishlist: WishlistItem[]
}

type Action =
  | { type: "ADD_TO_WISHLIST"; payload: WishlistItem }
  | { type: "REMOVE_FROM_WISHLIST"; payload: string }
  | { type: "INITIALIZE_WISHLIST"; payload: WishlistItem[] }
  | { type: "CLEAR_WISHLIST" }

const initialState: State = {
  wishlist: [],
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INITIALIZE_WISHLIST":
      return { ...state, wishlist: action.payload }
    case "ADD_TO_WISHLIST":
      if (state.wishlist.find((item) => item.id === action.payload.id)) {
        return state // Avoid duplicates
      }
      return { ...state, wishlist: [...state.wishlist, action.payload] }
    case "REMOVE_FROM_WISHLIST":
      return {
        ...state,
        wishlist: state.wishlist.filter((item) => item.id !== action.payload),
      }
    case "CLEAR_WISHLIST":
      return { ...state, wishlist: [] }
    default:
      return state
  }
}

interface WishlistContextType {
  state: State
  items: WishlistItem[]
  addToWishlist: (item: WishlistItem) => void
  removeFromWishlist: (id: string) => void
  clearWishlist: () => void
  isInWishlist: (id: string) => boolean
  getTotalItems: () => number
}

const WishlistContext = createContext<WishlistContextType>({
  state: initialState,
  items: [],
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  clearWishlist: () => {},
  isInWishlist: () => false,
  getTotalItems: () => 0,
})

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load from localStorage on first render
  useEffect(() => {
    const storedWishlist = localStorage.getItem("wishlist")
    if (storedWishlist) {
      try {
        dispatch({
          type: "INITIALIZE_WISHLIST",
          payload: JSON.parse(storedWishlist),
        })
      } catch (error) {
        console.error("Error loading wishlist from localStorage:", error)
      }
    }
  }, [])

  // Save to localStorage whenever wishlist changes
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(state.wishlist))
  }, [state.wishlist])

  const addToWishlist = (item: WishlistItem) => dispatch({ type: "ADD_TO_WISHLIST", payload: item })

  const removeFromWishlist = (id: string) => dispatch({ type: "REMOVE_FROM_WISHLIST", payload: id })

  const clearWishlist = () => dispatch({ type: "CLEAR_WISHLIST" })

  const isInWishlist = (id: string) => state.wishlist.some((item) => item.id === id)

  const getTotalItems = () => state.wishlist.length

  return (
    <WishlistContext.Provider
      value={{
        state,
        items: state.wishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
        getTotalItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
