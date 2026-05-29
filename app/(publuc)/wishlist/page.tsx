'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/context/wishlist-context'

export default function WishlistPage() {
  const { state, removeFromWishlist } = useWishlist()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Your Wishlist</h1>

      {state.wishlist.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-base sm:text-lg text-muted-foreground">Your wishlist is empty.</p>
          <Link href="/stores">
            <Button className="mt-4">Browse Stores</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {state.wishlist.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 border rounded-lg p-3 sm:p-4"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={80}
                  height={80}
                  className="rounded h-16 w-16 sm:h-20 sm:w-20 object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-lg font-medium truncate">{item.name}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {item.price.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <Link href={`/stores/${item.storeSlug}/products/${item.id}`}>
                  <Button size="sm" className="text-xs sm:text-sm px-3 sm:px-4">View</Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-800 p-0 hover:bg-transparent"
                  onClick={() => removeFromWishlist(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
