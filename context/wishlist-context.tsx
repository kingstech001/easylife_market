'use client'

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react'

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
  | { type: 'ADD_TO_WISHLIST'; payload: WishlistItem }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: string }
  | { type: 'INITIALIZE_WISHLIST'; payload: WishlistItem[] }

const initialState: State = {
  wishlist: [],
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INITIALIZE_WISHLIST':
      return { ...state, wishlist: action.payload }

    case 'ADD_TO_WISHLIST':
      if (state.wishlist.find((item) => item.id === action.payload.id)) {
        return state // Avoid duplicates
      }
      return { ...state, wishlist: [...state.wishlist, action.payload] }

    case 'REMOVE_FROM_WISHLIST':
      return {
        ...state,
        wishlist: state.wishlist.filter((item) => item.id !== action.payload),
      }

    default:
      return state
  }
}

const WishlistContext = createContext<{
  state: State
  addToWishlist: (item: WishlistItem) => void
  removeFromWishlist: (id: string) => void
  isInWishlist: (id: string) => boolean
}>({
  state: initialState,
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  isInWishlist: () => false,
})

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  // Load from localStorage on first render
  useEffect(() => {
    const storedWishlist = localStorage.getItem('wishlist')
    if (storedWishlist) {
      dispatch({
        type: 'INITIALIZE_WISHLIST',
        payload: JSON.parse(storedWishlist),
      })
    }
  }, [])

  // Save to localStorage whenever wishlist changes
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(state.wishlist))
  }, [state.wishlist])

  const addToWishlist = (item: WishlistItem) =>
    dispatch({ type: 'ADD_TO_WISHLIST', payload: item })

  const removeFromWishlist = (id: string) =>
    dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: id })

  const isInWishlist = (id: string) =>
    state.wishlist.some((item) => item.id === id)

  return (
    <WishlistContext.Provider
      value={{ state, addToWishlist, removeFromWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
