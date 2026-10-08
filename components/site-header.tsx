"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  Truck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { MainNav } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import CartOverlay from "./CartOverlay";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Announcement
// ─────────────────────────────────────────────────────────────────────────────

const FREE_DELIVERY_START = new Date("2026-09-01T00:00:00+01:00").getTime();
const FREE_DELIVERY_END = new Date("2026-10-01T00:00:00+01:00").getTime();

function getFreeDeliveryAnnouncement(now = Date.now()) {
  if (now >= FREE_DELIVERY_END) return null;
  return now < FREE_DELIVERY_START
    ? "Free delivery within Ogrute starts September 1 and ends September 30"
    : "Free delivery is live within Ogrute until September 30";
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────────────────────

const iconBtn =
  "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

const countBadge =
  "absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-[#0E5A43] bg-[#f6cf66] px-1 text-[10px] font-bold leading-none text-[#083B2D] animate-in zoom-in-50";

// Restyles whatever <button> ThemeToggle renders so it fits the green header
const themeToggleWrap =
  "[&_button]:h-10 [&_button]:w-10 [&_button]:rounded-full [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-white/85 [&_button]:hover:bg-white/15 [&_button]:hover:text-white";

function Divider() {
  return <span aria-hidden className="mx-1.5 h-6 w-px bg-white/20" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [dashboardLink, setDashboardLink] = useState("/dashboard");
  const [deliveryAnnouncement, setDeliveryAnnouncement] = useState(() =>
    getFreeDeliveryAnnouncement(),
  );
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
  // Pages that already have their own search bar
  const hideHeaderSearch =
    (pathname?.startsWith("/Search") ?? false) ||
    pathname === "/stores" ||
    // All store products page (matched case-insensitively, any nesting)
    (pathname?.toLowerCase().includes("allstoreproducts") ?? false);

  // Shrink + add glass effect once the page scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const updateAnnouncement = () =>
      setDeliveryAnnouncement(getFreeDeliveryAnnouncement());
    const interval = window.setInterval(updateAnnouncement, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
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
      } catch {
        setAuthenticated(false);
        setUserRole(null);
      }
    }
    checkAuth();
  }, [pathname]);

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

  const accountLabel = showShoppingFeatures ? "Account" : "Dashboard";
  const AccountIcon = showShoppingFeatures ? User : LayoutDashboard;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b transition-[background-color,box-shadow,border-color] duration-300",
          scrolled
            ? "border-white/10 bg-[#0E5A43]/95 shadow-[0_8px_30px_rgba(8,59,45,0.35)] backdrop-blur-xl"
            : "border-[#0b4d3d]/40 bg-[#0E5A43] shadow-[0_10px_30px_rgba(14,90,67,0.18)]",
        )}
      >
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.12),_transparent_28%)]" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "url('/icon.png')",
              backgroundRepeat: "repeat",
              backgroundSize: "400px 400px",
              backgroundPosition: "center",
            }}
          />
        </div>

        {/* Announcement bar (only renders while a promo is active) */}
        {deliveryAnnouncement && (
          <div className="relative bg-[#083B2D] text-white/90">
            <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-2 px-4 py-1.5 text-center text-[11px] font-medium sm:text-xs">
              <Truck className="h-3.5 w-3.5 shrink-0 text-[#f6cf66]" />
              <span>{deliveryAnnouncement}</span>
            </div>
          </div>
        )}

        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          {/* ── Main row ─────────────────────────────────────────────────── */}
          <div
            className={cn(
              "flex items-center gap-3 transition-[height] duration-300",
              scrolled ? "h-14" : "h-16",
            )}
          >
            <div className="shrink-0">
              <MainNav />
            </div>

            {/* Inline search (large screens) */}
            {!hideHeaderSearch && (
              <div className="mx-2 hidden min-w-0 flex-1 lg:block xl:mx-6">
                <div className="mx-auto max-w-xl">
                  <SearchBox variant="inline" shortcut />
                </div>
              </div>
            )}

            {/* Desktop actions */}
            <div className="ml-auto hidden shrink-0 items-center gap-1 md:flex">
              {showShoppingFeatures && (
                <>
                  <Link
                    href="/wishlist"
                    aria-label="Wishlist"
                    className={cn(
                      iconBtn,
                      pathname === "/wishlist" && "bg-white/15 text-white",
                    )}
                  >
                    <Heart className="h-[18px] w-[18px]" />
                    {wishlistCount > 0 && (
                      <span className={countBadge}>
                        {wishlistCount > 99 ? "99+" : wishlistCount}
                      </span>
                    )}
                  </Link>

                  <button
                    type="button"
                    aria-label="Shopping cart"
                    onClick={() => setCartOpen(true)}
                    className={iconBtn}
                  >
                    <ShoppingCart className="h-[18px] w-[18px]" />
                    {itemCount > 0 && (
                      <span className={countBadge}>
                        {itemCount > 99 ? "99+" : itemCount}
                      </span>
                    )}
                  </button>

                  <Divider />
                </>
              )}

              {authenticated ? (
                <Link
                  href={dashboardLink}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-medium text-white ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <AccountIcon className="h-4 w-4" />
                  {accountLabel}
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/register"
                    className="mr-1 hidden h-10 items-center gap-2 rounded-full border border-[#f6cf66]/60 px-4 text-sm font-medium text-[#f6cf66] transition-colors hover:bg-[#f6cf66] hover:text-[#083B2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 xl:inline-flex"
                  >
                    <Store className="h-4 w-4" />
                    Create store
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-white/90 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="hidden h-10 items-center rounded-full bg-white px-5 lg:inline-flex text-sm font-semibold text-[#0E5A43] shadow-sm transition-colors hover:bg-[#f6cf66] hover:text-[#083B2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    Sign up
                  </Link>
                </>
              )}

              <Divider />
              <div className={themeToggleWrap}>
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile actions */}
            <div className="ml-auto flex items-center gap-1 md:hidden">
              {!authenticated && (
                <Link
                  href="/auth/register"
                  className="mr-1 inline-flex h-8 items-center rounded-full border border-[#f6cf66]/60 px-3 text-xs font-semibold text-[#f6cf66] transition-colors active:bg-[#f6cf66] active:text-[#083B2D]"
                >
                  Create store
                </Link>
              )}
              {showShoppingFeatures ? (
                <button
                  type="button"
                  aria-label="Shopping cart"
                  onClick={() => setCartOpen(true)}
                  className={iconBtn}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className={countBadge}>
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  href={dashboardLink}
                  aria-label="Dashboard"
                  className={cn(
                    iconBtn,
                    pathname?.startsWith("/dashboard") && "bg-white/15 text-white",
                  )}
                >
                  <User className="h-5 w-5" />
                </Link>
              )}
              <div className={themeToggleWrap}>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* ── Search row (mobile + tablet) ─────────────────────────────── */}
          {!hideHeaderSearch && (
            <div className="pb-3 lg:hidden">
              <SearchBox variant="row" />
            </div>
          )}
        </div>
      </header>

      {/* Cart Overlay */}
      {cartOpen && <CartOverlay onClose={() => setCartOpen(false)} />}

      {/* ── Mobile bottom navigation ───────────────────────────────────────── */}
      <nav
        aria-label="Mobile"
        className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 md:hidden"
      >
        <div
          className={cn(
            "grid h-16",
            showShoppingFeatures ? "grid-cols-4" : "grid-cols-3",
          )}
        >
          <BottomNavItem
            href="/"
            label="Home"
            icon={Home}
            active={pathname === "/"}
          />
          <BottomNavItem
            href="/stores"
            label="Stores"
            icon={Store}
            active={pathname === "/stores" || !!pathname?.startsWith("/stores/")}
          />
          {showShoppingFeatures && (
            <BottomNavItem
              href="/wishlist"
              label="Wishlist"
              icon={Heart}
              active={pathname === "/wishlist"}
              badge={wishlistCount}
            />
          )}
          {authenticated ? (
            <BottomNavItem
              href={dashboardLink}
              label={accountLabel}
              icon={AccountIcon}
              active={!!pathname?.startsWith("/dashboard")}
            />
          ) : (
            <BottomNavItem
              href="/auth/login"
              label="Login"
              icon={LogIn}
              active={!!pathname?.startsWith("/auth")}
            />
          )}
        </div>
      </nav>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom nav item
// ─────────────────────────────────────────────────────────────────────────────

function BottomNavItem({
  href,
  label,
  icon: Icon,
  active,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
        active
          ? "text-[#0E5A43] dark:text-emerald-400"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0 h-0.5 w-8 rounded-full bg-[#0E5A43] transition-opacity dark:bg-emerald-400",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      <span className="relative">
        <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
        {badge > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#0E5A43] px-1 text-[9px] font-bold leading-none text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Search
// ─────────────────────────────────────────────────────────────────────────────

type SearchResults = { stores: any[]; products: any[] };
const EMPTY_RESULTS: SearchResults = { stores: [], products: [] };

function SearchBox({
  variant,
  shortcut = false,
}: {
  variant: "inline" | "row";
  shortcut?: boolean;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const trimmed = query.trim();
  const showPanel = open && trimmed.length > 2;
  const hasResults = results.stores.length > 0 || results.products.length > 0;

  // Debounced search (cancels stale requests)
  useEffect(() => {
    if (trimmed.length <= 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults({
            stores: data?.stores ?? [],
            products: data?.products ?? [],
          });
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Search error:", error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  // Close the panel when clicking outside
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // "/" focuses the search box (desktop shortcut)
  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const typing =
        el?.tagName === "INPUT" ||
        el?.tagName === "TEXTAREA" ||
        el?.isContentEditable;
      if (typing) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  const reset = () => {
    setOpen(false);
    setQuery("");
    setResults(EMPTY_RESULTS);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/Search?search=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div ref={rootRef} className="relative">
      <form onSubmit={onSubmit} role="search" className="group relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70 transition-colors group-focus-within:text-slate-500" />

        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={
            variant === "row"
              ? "Search stores & products..."
              : "Search for stores or products..."
          }
          aria-label="Search stores and products"
          className={cn(
            "w-full rounded-full border border-white/15 bg-white/15 pl-10 pr-10 text-base text-white outline-none transition-all duration-200 sm:text-sm",
            "placeholder:text-white/60 hover:bg-white/20",
            "focus:border-transparent focus:bg-white focus:text-slate-800 focus:ring-4 focus:ring-white/20 focus:placeholder:text-slate-400",
            variant === "row" ? "h-11" : "h-10",
          )}
        />

        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults(EMPTY_RESULTS);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-black/10 group-focus-within:text-slate-500"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          shortcut && (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-white/25 px-1.5 text-[10px] font-medium text-white/60 group-focus-within:hidden xl:inline-flex">
              /
            </kbd>
          )
        )}
      </form>

      {/* Results panel */}
      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border/60 bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 slide-in-from-top-1 duration-150">
          <div className="max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain">
            {loading && !hasResults ? (
              <div className="flex items-center justify-center gap-3 p-8 text-sm text-muted-foreground">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0E5A43] border-t-transparent" />
                Searching...
              </div>
            ) : !hasResults ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p className="text-sm">No results found for “{trimmed}”</p>
              </div>
            ) : (
              <div
                className={cn(
                  "divide-y divide-border/50 transition-opacity",
                  loading && "opacity-60",
                )}
              >
                {results.stores.length > 0 && (
                  <div className="p-2">
                    <h3 className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Stores
                    </h3>
                    {results.stores.map((store: any) => (
                      <ResultRow
                        key={store._id}
                        href={`/stores/${store.slug || store._id}`}
                        image={store.logo}
                        title={store.businessName}
                        subtitle={store.description || store.location}
                        fallback={Store}
                        onClick={reset}
                      />
                    ))}
                  </div>
                )}

                {results.products.length > 0 && (
                  <div className="p-2">
                    <h3 className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Products
                    </h3>
                    {results.products.map((product: any) => (
                      <ResultRow
                        key={product._id}
                        href={`/stores/${product.storeSlug}/products/${product._id}`}
                        image={product.image}
                        title={product.name}
                        subtitle={
                          product.price != null ? (
                            <span className="font-semibold text-[#0E5A43] dark:text-emerald-400">
                              ₦{Number(product.price).toLocaleString()}
                            </span>
                          ) : null
                        }
                        fallback={Package}
                        onClick={reset}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {hasResults && (
            <Link
              href={`/Search?search=${encodeURIComponent(trimmed)}`}
              onClick={reset}
              className="flex items-center justify-between border-t border-border/50 bg-muted/40 px-5 py-3 text-sm font-medium text-[#0E5A43] transition-colors hover:bg-muted dark:text-emerald-400"
            >
              <span className="truncate">See all results for “{trimmed}”</span>
              <ArrowRight className="ml-3 h-4 w-4 shrink-0" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({
  href,
  image,
  title,
  subtitle,
  fallback: Fallback,
  onClick,
}: {
  href: string;
  image?: string;
  title: string;
  subtitle?: ReactNode;
  fallback: LucideIcon;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#0E5A43]/10 focus-visible:bg-[#0E5A43]/10 focus-visible:outline-none"
    >
      {image ? (
        <img
          src={image}
          alt={title}
          className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#0E5A43] text-white">
          <Fallback className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}