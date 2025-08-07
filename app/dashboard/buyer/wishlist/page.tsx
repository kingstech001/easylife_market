"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingCart, Trash2, Share2, Filter, Search, Grid, List, Star, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { useWishlist } from "@/context/wishlist-context"
import { useCart } from "@/context/cart-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ViewMode = "grid" | "list"
type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "name"

export default function WishlistPage() {
  const { items: wishlistItems, removeFromWishlist, clearWishlist, getTotalItems } = useWishlist()
  const { addToCart } = useCart()
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)

  const totalItems = getTotalItems()

  // Filter and sort wishlist items
  const filteredAndSortedItems = wishlistItems
    .filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesAvailability = !showAvailableOnly || true // Assume all items are available for now
      return matchesSearch && matchesAvailability
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "name":
          return a.name.localeCompare(b.name)
        case "oldest":
          return a.id.localeCompare(b.id) // Simple comparison, in real app would use dates
        case "newest":
        default:
          return b.id.localeCompare(a.id)
      }
    })

  const handleAddToCart = (item: (typeof wishlistItems)[0]) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    })
    toast.success(`${item.name} added to cart!`)
  }

  const handleAddAllToCart = () => {
    const itemsToAdd =
      selectedItems.length > 0 ? wishlistItems.filter((item) => selectedItems.includes(item.id)) : wishlistItems

    itemsToAdd.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
      })
    })

    toast.success(`${itemsToAdd.length} items added to cart!`)
    setSelectedItems([])
  }

  const handleRemoveSelected = () => {
    selectedItems.forEach((id) => removeFromWishlist(id))
    toast.success(`${selectedItems.length} items removed from wishlist`)
    setSelectedItems([])
  }

  const handleSelectAll = () => {
    if (selectedItems.length === filteredAndSortedItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredAndSortedItems.map((item) => item.id))
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Wishlist",
        text: `Check out my wishlist with ${totalItems} amazing items!`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Wishlist link copied to clipboard!")
    }
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Wishlist</h2>
            <p className="text-muted-foreground">Save items you love for later</p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Start adding items to your wishlist by clicking the heart icon on products you love.
            </p>
            <Button asChild>
              <Link href="/stores">
                <Plus className="mr-2 h-4 w-4" />
                Start Shopping
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Wishlist</h2>
          <p className="text-muted-foreground">
            {totalItems} {totalItems === 1 ? "item" : "items"} saved for later
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={handleAddAllToCart} disabled={wishlistItems.length === 0}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add All to Cart
          </Button>
        </div>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search wishlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Sort by
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("newest")}>Newest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")}>Oldest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-low")}>Price: Low to High</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-high")}>Price: High to Low</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name")}>Name A-Z</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Available Only Filter */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="available-only"
                  checked={showAvailableOnly}
                  onCheckedChange={(checked) => setShowAvailableOnly(checked as boolean)}
                />
                <label htmlFor="available-only" className="text-sm font-medium">
                  Available only
                </label>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <span className="text-sm text-muted-foreground">{selectedItems.length} items selected</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleAddAllToCart}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="sm" onClick={handleRemoveSelected}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Select All */}
      {filteredAndSortedItems.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedItems.length === filteredAndSortedItems.length}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select all ({filteredAndSortedItems.length} items)
            </label>
          </div>
          {wishlistItems.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearWishlist()
                toast.success("Wishlist cleared")
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      )}

      {/* Wishlist Items */}
      {filteredAndSortedItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={cn(
            viewMode === "grid" ? "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4",
          )}
        >
          {filteredAndSortedItems.map((item) => (
            <WishlistItem
              key={item.id}
              item={item}
              viewMode={viewMode}
              isSelected={selectedItems.includes(item.id)}
              onSelect={(selected) => {
                if (selected) {
                  setSelectedItems([...selectedItems, item.id])
                } else {
                  setSelectedItems(selectedItems.filter((id) => id !== item.id))
                }
              }}
              onAddToCart={() => handleAddToCart(item)}
              onRemove={() => {
                removeFromWishlist(item.id)
                toast.success(`${item.name} removed from wishlist`)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface WishlistItemProps {
  item: {
    id: string
    name: string
    price: number
    image: string
    storeSlug: string
  }
  viewMode: ViewMode
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onAddToCart: () => void
  onRemove: () => void
}

function WishlistItem({ item, viewMode, isSelected, onSelect, onAddToCart, onRemove }: WishlistItemProps) {
  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Checkbox checked={isSelected} onCheckedChange={onSelect} />
            <div className="relative h-20 w-20 overflow-hidden rounded-lg border flex-shrink-0">
              <Image
                src={item.image || "/placeholder.svg?height=80&width=80"}
                alt={item.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/stores/${item.storeSlug}/products/${item.id}`} className="hover:underline">
                <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
              </Link>
              <p className="text-sm text-muted-foreground">Store: {item.storeSlug}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm ml-1">4.5</span>
                </div>
                <Badge variant="secondary">In Stock</Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">₦{item.price.toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-2">
                <Button onClick={onAddToCart} size="sm">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="sm" onClick={onRemove}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="relative">
            <Checkbox
              className="absolute top-2 left-2 z-10 bg-white/90 border-2"
              checked={isSelected}
              onCheckedChange={onSelect}
            />
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={item.image || "/placeholder.svg?height=300&width=300"}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 bg-white/90 hover:bg-white"
              onClick={onRemove}
            >
              <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            </Button>
          </div>

          <div className="space-y-2">
            <Link href={`/stores/${item.storeSlug}/products/${item.id}`} className="hover:underline">
              <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">{item.name}</h3>
            </Link>

            <p className="text-sm text-muted-foreground">Store: {item.storeSlug}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm ml-1">4.5</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  In Stock
                </Badge>
              </div>
            </div>

            <p className="text-xl font-bold text-primary">₦{item.price.toFixed(2)}</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={onAddToCart} className="flex-1">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
            <Button variant="outline" size="icon" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
