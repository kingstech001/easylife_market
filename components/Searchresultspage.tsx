"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Package, Loader2, Filter, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Product type
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id?: string;
  inventory_quantity: number;
  images: { id: string; url: string; alt_text: string | null }[];
  store_id: string;
  store_slug?: string;
  created_at: string;
  updated_at: string;
};

// API Product type
type ApiProduct = {
  _id: string;
  name: string;
  description?: string | null;
  price: number;
  compareAtPrice?: number | null;
  compare_at_price?: number | null;
  primaryImage?: string;
  images?: { id?: string; _id?: string; url: string; alt_text?: string | null; altText?: string | null }[];
  inventoryQuantity?: number;
  inventory_quantity?: number;
  storeId?:
    | string
    | {
        _id: string;
        name: string;
        slug: string;
      };
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

const PRODUCTS_PER_PAGE = 12;

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || searchParams.get("q") || "";
  const categoryQuery = searchParams.get("category") || "";
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  // Transform API product to Product type
  const transformProduct = (p: ApiProduct): Product => {
    let productImages = p.images || [];
    if (productImages.length === 0 && p.primaryImage) {
      productImages = [{ 
        id: '1', 
        _id: '1',
        url: p.primaryImage, 
        alt_text: null,
        altText: null 
      }];
    }

    const storeId = typeof p.storeId === 'string' ? p.storeId : p.storeId?._id || '';
    const storeSlug = typeof p.storeId === 'object' && p.storeId?.slug ? p.storeId.slug : '';

    return {
      id: p._id,
      name: p.name,
      description: p.description || null,
      price: p.price,
      compare_at_price: p.compareAtPrice || p.compare_at_price || null,
      inventory_quantity: p.inventoryQuantity ?? p.inventory_quantity ?? 0,
      images: productImages.map((img: any) => ({
        id: img.id || img._id?.toString() || '',
        url: img.url || '',
        alt_text: img.alt_text || img.altText || null,
      })),
      store_id: storeId,
      store_slug: storeSlug,
      created_at: p.createdAt || p.created_at || new Date().toISOString(),
      updated_at: p.updatedAt || p.updated_at || new Date().toISOString(),
    };
  };

  // Fetch all products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await fetch("/api/allStoreProducts");
        
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        const transformedProducts: Product[] = (data.products || []).map(transformProduct);
        
        setAllProducts(transformedProducts);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching products:", err);
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Filter products based on search/category
  useEffect(() => {
    if (allProducts.length === 0) {
      setFilteredProducts([]);
      setDisplayedProducts([]);
      return;
    }

    const query = (searchQuery || categoryQuery).toLowerCase().trim();
    
    if (!query) {
      setFilteredProducts(allProducts);
      setDisplayedProducts(allProducts.slice(0, PRODUCTS_PER_PAGE));
      setHasMore(allProducts.length > PRODUCTS_PER_PAGE);
      setPage(1);
      return;
    }

    // Filter products
    const filtered = allProducts.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(query);
      const descriptionMatch = product.description?.toLowerCase().includes(query) || false;
      
      return nameMatch || descriptionMatch;
    });

    console.log(`🔍 Search for "${query}": Found ${filtered.length} products`);

    setFilteredProducts(filtered);
    setDisplayedProducts(filtered.slice(0, PRODUCTS_PER_PAGE));
    setHasMore(filtered.length > PRODUCTS_PER_PAGE);
    setPage(1);
  }, [searchQuery, categoryQuery, allProducts]);

  // Load more products
  const loadMoreProducts = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    setTimeout(() => {
      const startIndex = page * PRODUCTS_PER_PAGE;
      const endIndex = startIndex + PRODUCTS_PER_PAGE;
      const newProducts = filteredProducts.slice(startIndex, endIndex);

      if (newProducts.length > 0) {
        setDisplayedProducts(prev => [...prev, ...newProducts]);
        setPage(prev => prev + 1);
        setHasMore(endIndex < filteredProducts.length);
      } else {
        setHasMore(false);
      }

      setLoadingMore(false);
    }, 300);
  }, [page, filteredProducts, hasMore, loadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loadMoreProducts]);

  // Handle local search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      window.location.href = `/Search?search=${encodeURIComponent(localSearchQuery.trim())}`;
    }
  };

  const clearSearch = () => {
    window.location.href = '/Search';
  };

  const currentQuery = searchQuery || categoryQuery;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Searching products...</h3>
            <p className="text-sm text-muted-foreground">
              Finding the best matches for you
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <Package className="h-16 w-16 text-destructive mx-auto" />
          <h3 className="text-xl font-semibold">Error Loading Products</h3>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Search Header */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="pl-12 pr-12 h-12 text-base rounded-full border-2 border-border focus-visible:border-[#e1a200] focus-visible:ring-[#e1a200]/20"
              />
              {localSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLocalSearchQuery("")}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              <Button
                type="submit"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 rounded-full bg-gradient-to-r from-[#e1a200] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#e1a200]"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Results Info */}
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3 flex-wrap">
              {currentQuery && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Searching for:</span>
                  <Badge variant="secondary" className="text-sm">
                    {currentQuery}
                    <button
                      onClick={clearSearch}
                      className="ml-2 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
              {/* <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredProducts.length}</span> products found
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Products Grid */}
        {displayedProducts.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Package className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">
              {currentQuery 
                ? `We couldn't find any products matching "${currentQuery}"`
                : "Try searching for something else"
              }
            </p>
            <Button
              onClick={clearSearch}
              variant="outline"
              className="border-2 hover:border-[#e1a200]/50"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <>
            {/* Products Count
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {displayedProducts.length} of {filteredProducts.length} products
              </p>
            </div> */}

            {/* Products Grid */}
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  storeSlug={product.store_slug || ""}
                />
              ))}
            </div>

            {/* Loading More Indicator */}
            <div ref={observerTarget} className="py-8">
              {loadingMore && (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading more products...</p>
                </div>
              )}
              
              {!hasMore && displayedProducts.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    You've reached the end of the results
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {displayedProducts.length} products total
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}