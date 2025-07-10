"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Filter, SearchIcon, SlidersHorizontal, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { mockProducts, mockStores } from "@/lib/mock-data"
import { formatPrice } from "@/lib/utils"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const [searchTerm, setSearchTerm] = useState(query)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [inStock, setInStock] = useState(true)
  const [sortBy, setSortBy] = useState<"relevance" | "price-asc" | "price-desc">("relevance")

  // Filter products based on search term
  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description?.toLowerCase().includes(query.toLowerCase()) ||
      false
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]
    const matchesStock = inStock ? product.inventory_quantity > 0 : true

    return matchesSearch && matchesPrice && matchesStock
  })

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price
    if (sortBy === "price-desc") return b.price - a.price
    return 0 // relevance (default order)
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
  }

  return (
    <div className="container py-10">
      <AnimatedContainer animation="fadeIn" className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        <p className="text-muted-foreground">
          {sortedProducts.length} results for "{query}"
        </p>
      </AnimatedContainer>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters - Mobile */}
        <AnimatedContainer className="md:hidden" animation={isFilterOpen ? "slideIn" : "none"}>
          <Button
            variant="outline"
            className="w-full flex items-center justify-between mb-4"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <span className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </span>
            {isFilterOpen ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
          </Button>

          {isFilterOpen && (
            <div className="border rounded-lg p-4 mb-6 space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Price Range</h3>
                <Slider defaultValue={priceRange} min={0} max={1000} step={10} onValueChange={setPriceRange} />
                <div className="flex justify-between text-sm">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="font-medium">In Stock Only</span>
                <Switch checked={inStock} onCheckedChange={setInStock} />
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Sort By</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={sortBy === "relevance" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("relevance")}
                  >
                    Relevance
                  </Button>
                  <Button
                    variant={sortBy === "price-asc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("price-asc")}
                  >
                    Price: Low to High
                  </Button>
                  <Button
                    variant={sortBy === "price-desc" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("price-desc")}
                  >
                    Price: High to Low
                  </Button>
                </div>
              </div>
            </div>
          )}
        </AnimatedContainer>

        {/* Filters - Desktop */}
        <AnimatedContainer animation="slideIn" className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-6 border rounded-lg p-6 space-y-6">
            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-10 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Price Range</h3>
              <Slider defaultValue={priceRange} min={0} max={1000} step={10} onValueChange={setPriceRange} />
              <div className="flex justify-between text-sm">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-medium">In Stock Only</span>
              <Switch checked={inStock} onCheckedChange={setInStock} />
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-medium">Sort By</h3>
              <div className="space-y-2">
                <Button
                  variant={sortBy === "relevance" ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSortBy("relevance")}
                >
                  Relevance
                </Button>
                <Button
                  variant={sortBy === "price-asc" ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSortBy("price-asc")}
                >
                  Price: Low to High
                </Button>
                <Button
                  variant={sortBy === "price-desc" ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSortBy("price-desc")}
                >
                  Price: High to Low
                </Button>
              </div>
            </div>
          </div>
        </AnimatedContainer>

        {/* Search Results */}
        <div className="flex-1">
          {/* Mobile Search Form */}
          <AnimatedContainer animation="fadeIn" className="mb-6 md:hidden">
            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-10 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </AnimatedContainer>

          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product, index) => {
                // Find the store for this product
                const store = mockStores.find((s) => s.id === product.store_id)

                return (
                  <AnimatedContainer key={product.id} animation="fadeIn" delay={index * 0.05}>
                    <Card
                      className="overflow-hidden h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/stores/${store?.slug}/products/${product.id}`)}
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <Image
                          src={product.images[0]?.url || "/placeholder.svg?height=300&width=300"}
                          alt={product.images[0]?.alt_text || product.name}
                          fill
                          className="object-cover transition-transform hover:scale-105"
                        />
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                            {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-grow">
                        <div className="text-sm text-muted-foreground mb-1">{store?.name}</div>
                        <h3 className="font-medium line-clamp-1">{product.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {product.description || "No description available"}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="font-semibold">{formatPrice(product.price)}</div>
                          {product.inventory_quantity <= 0 && (
                            <span className="text-xs text-red-500 font-medium">Out of stock</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </AnimatedContainer>
                )
              })}
            </div>
          ) : (
            <AnimatedContainer animation="fadeIn" className="text-center py-12">
              <div className="inline-flex items-center justify-center rounded-full bg-muted p-6 mb-4">
                <SearchIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No results found</h2>
              <p className="text-muted-foreground mb-6">We couldn't find any products matching "{query}".</p>
              <Button onClick={() => router.push("/stores")}>Browse All Stores</Button>
            </AnimatedContainer>
          )}
        </div>
      </div>
    </div>
  )
}
