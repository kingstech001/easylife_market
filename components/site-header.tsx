"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingCart,
  Heart,
  LayoutDashboard,
  Search,
  Store,
  Package,
  Home,
  User,
  LogIn,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MainNav } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import CartOverlay from "./CartOverlay";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    stores: any[];
    products: any[];
  }>({ stores: [], products: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [dashboardLink, setDashboardLink] = useState("/dashboard");
  const { items } = useCart();
  const { state: wishlistState } = useWishlist();

  const itemCount =
    items?.reduce(
      (total: number, item: { quantity: number }) => total + item.quantity,
      0,
    ) ?? 0;
  const wishlistCount = wishlistState?.wishlist
    ? wishlistState.wishlist.length
    : 0;

  // Don't show cart and wishlist for sellers
  const showShoppingFeatures = userRole !== "seller";

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = await res.json();
      if (data?.user) {
        setAuthenticated(true);
        const role = data.user.role;
        setUserRole(role);
        if (role === "buyer") setDashboardLink("/dashboard/buyer");
        else if (role === "seller") setDashboardLink("/dashboard/seller");
        else if (role === "admin") setDashboardLink("/dashboard/admin");
      } else {
        setAuthenticated(false);
        setUserRole(null);
      }
    }
    checkAuth();
  }, [pathname]);

  // Search functionality
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        try {
          const response = await fetch(
            `/api/search?q=${encodeURIComponent(searchQuery)}`,
          );
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data);
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults({ stores: [], products: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (searchOpen && !target.closest(".search-container")) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen]);

  async function handleLogout() {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      toast.success("Logged out");
      setAuthenticated(false);
      setUserRole(null);
      router.push("/");
      router.refresh();
    } else {
      toast.error("Logout failed");
    }
  }

  const handleSearchResultClick = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults({ stores: [], products: [] });
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Main Nav */}
            <div className="flex items-center gap-6">
              <MainNav />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <nav className="flex items-center space-x-1">
                {/* Search Button */}
                {/* <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-[#e1a200]/10 hover:text-[#e1a200] transition-colors"
                  onClick={() => setSearchOpen(!searchOpen)}
                >
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button> */}

                {/* Shopping Features - Only for non-sellers */}
                {showShoppingFeatures && (
                  <>
                    {/* Wishlist */}
                    <div className="relative">
                      <Link href="/wishlist">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 relative hover:bg-[#e1a200]/10 hover:text-[#e1a200] transition-colors"
                        >
                          <Heart className="h-4 w-4" />
                          <span className="sr-only">Wishlist</span>
                          {wishlistCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-medium animate-in zoom-in-50 bg-gradient-to-br from-[#e1a200] to-[#e1a200] border-0"
                            >
                              {wishlistCount > 99 ? "99+" : wishlistCount}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                    </div>

                    {/* Cart */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 relative hover:bg-[#e1a200]/10 hover:text-[#e1a200] transition-colors"
                        onClick={() => setCartOpen(true)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span className="sr-only">Shopping cart</span>
                        {itemCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-medium animate-in zoom-in-50 bg-[#e1a200] border-0"
                          >
                            {itemCount > 99 ? "99+" : itemCount}
                          </Badge>
                        )}
                      </Button>
                    </div>

                    <Separator orientation="vertical" className="h-6 mx-2" />
                  </>
                )}

                {/* Notifications - Only for authenticated users
                {authenticated && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-[#e1a200]/10 hover:text-[#e1a200] transition-colors"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Notifications</span>
                  </Button>
                )} */}

                {/* Auth Actions */}
                {authenticated ? (
                  <div className="flex items-center space-x-1">
                    <Link href={dashboardLink}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-[#e1a200]/10 hover:text-[#e1a200] transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="sr-only">Dashboard</span>
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Link href="/auth/login">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 hover:bg-[#e1a200]/10 hover:text-[#e1a200] transition-colors"
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Login
                      </Button>
                    </Link>
                  </div>
                )}

                <Separator orientation="vertical" className="h-6 mx-2" />
                <ThemeToggle />
              </nav>
            </div>

            {/* Mobile Toggle */}
            <div className="flex items-center md:hidden justify-center space-x-2">
              {/* Cart - Only for non-sellers */}
          {showShoppingFeatures ? (
            <button
              onClick={() => setCartOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors relative hover:text-foreground",
              )}
            >
              <ShoppingCart className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              {itemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute bottom-3 left-3 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[9px] font-medium bg-[#e1a200] border-0"
                >
                  {itemCount > 9 ? "9+" : itemCount}
                </Badge>
              )}
            </button>
          ) : (
            /* Profile for sellers (replaces cart) */
            <Link
              href={dashboardLink}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                pathname?.startsWith("/dashboard")
                  ? "text-[#e1a200]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <User className="h-5 w-5" />
            </Link>
          )}
              {/* Theme Toggle */}
              <ThemeToggle />
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div
            className={cn(
              "search-container overflow-hidden transition-all duration-300 ease-in-out",
              searchOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0",
            )}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search for stores or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-12 text-base border-border/50 focus:border-[#c0a146]/50 focus:ring-[#c0a146]/20"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:text-[#e1a200]"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults({ stores: [], products: [] });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Search Results */}
            {searchQuery.length > 2 && (
              <Card className="mt-2 max-h-80 overflow-y-auto border-border/50">
                {isSearching ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e1a200] mx-auto"></div>
                    <p className="mt-2">Searching...</p>
                  </div>
                ) : searchResults.stores.length === 0 &&
                  searchResults.products.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {/* Stores Results */}
                    {searchResults.stores.length > 0 && (
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-3">
                          Stores
                        </h3>
                        <div className="space-y-1">
                          {searchResults.stores.map((store: any) => (
                            <Link
                              key={store._id}
                              href={`/stores/${store.slug || store._id}`}
                              onClick={handleSearchResultClick}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#c0a146]/10 transition-colors"
                            >
                              {store.logo ? (
                                <img
                                  src={store.logo || "/placeholder.svg"}
                                  alt={store.businessName}
                                  className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#e1a200]/20 to-[#d4b55e]/20 flex items-center justify-center flex-shrink-0">
                                  <Store className="h-5 w-5 text-[#e1a200]" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {store.businessName}
                                </p>
                                <p className="text-sm text-muted-foreground truncate line-clamp-1">
                                  {store.description || store.location}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products Results */}
                    {searchResults.products.length > 0 && (
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-3">
                          Products
                        </h3>
                        <div className="space-y-1">
                          {searchResults.products.map((product: any) => (
                            <Link
                              key={product._id}
                              href={`/stores/${product.storeSlug}/products/${product._id}`}
                              onClick={handleSearchResultClick}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#e1a200]/10 transition-colors"
                            >
                              {product.image ? (
                                <img
                                  src={product.image || "/placeholder.svg"}
                                  alt={product.name}
                                  className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#e1a200]/20 to-[#d4b55e]/20 flex items-center justify-center flex-shrink-0">
                                  <Package className="h-5 w-5 text-[#e1a200]" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {product.name}
                                </p>
                                <p className="text-sm text-[#e1a200] font-semibold">
                                  ₦{product.price?.toLocaleString()}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </header>

      {/* Cart Overlay */}
      {cartOpen && <CartOverlay onClose={() => setCartOpen(false)} />}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border/40 pb-safe">
        <div
          className={cn(
            "grid h-16",
            showShoppingFeatures ? "grid-cols-4" : "grid-cols-4",
          )}
        >
          {/* Home */}
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              pathname === "/"
                ? "text-[#e1a200]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </Link>

          {/* Stores */}
          <Link
            href="/stores"
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              pathname === "/stores" || pathname?.startsWith("/stores/")
                ? "text-[#e1a200]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Store className="h-5 w-5" />
            <span className="text-xs font-medium">Stores</span>
          </Link>

          {/* Wishlist - Only for non-sellers */}
          {showShoppingFeatures && (
            <Link
              href="/wishlist"
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors relative",
                pathname === "/wishlist"
                  ? "text-[#e1a200]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Heart className="h-5 w-5" />
              <span className="text-xs font-medium">Wishlist</span>
              {wishlistCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute top-0 right-6 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[9px] font-medium bg-[#e1a200] border-0"
                >
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </Badge>
              )}
            </Link>
          )}

          
          {authenticated ? (
            <div className="flex items-center justify-center">
              <Link href={dashboardLink}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="text-xs font-medium">Dashboard</span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="m-auto">
              <Link
                href="/auth/login"
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  pathname?.startsWith("/dashboard")
                    ? "text-[#e1a200]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LogIn className="h-5 w-5" />
                <span className="text-xs font-medium">Login</span>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
