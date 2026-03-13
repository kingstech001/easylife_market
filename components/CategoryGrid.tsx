"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Smartphone,
  Car,
  Shirt,
  Home,
  Laptop,
  Package,
  Tv,
  HeartPulse,
  Apple,
  CookingPot,
} from "lucide-react";

// Category type definition
export type Category = {
  name: string;
  icon: any;
  subcategories: string[];
};

// Categories data
export const CATEGORIES: Category[] = [
  {
    name: "Restaurants",
    icon: CookingPot,
    subcategories: ["Fast Food", "Fine Dining", "Cafes", "Bakeries", "food", "restaurants"],
  },
  {
    name: "Electronics",
    icon: Tv,
    subcategories: ["Television", "Cameras & Photo", "Home Audio", "Tv", "electronics"],
  },
  {
    name: "Vehicles",
    icon: Car,
    subcategories: ["Cars", "Automotive", "Trucks", "Spare Parts"],
  },
  {
    name: "Fashion",
    icon: Shirt,
    subcategories: ["Clothing", "Shoes", "Accessories", "Jewelry", "Bags", "game wear", "sportswear"],
  },
  {
    name: "Home & Office",
    icon: Home,
    subcategories: ["Furniture", "Decor", "Kitchen", "Garden Tools", "Office Product"],
  },
  {
    name: "Computing",
    icon: Laptop,
    subcategories: ["Laptops", "Desktops", "Peripherals", "Software"],
  },
  {
    name: "Phones & Tablets",
    icon: Smartphone,
    subcategories: ["Smartphones", "Tablets", "Accessories", "Smart Watches"],
  },
  {
    name: "Supermarket",
    icon: Apple,
    subcategories: ["Groceries", "Fresh Produce", "Farm Tools", "Food", "Beverages"],
  },
  {
    name: "Health & Beauty",
    icon: HeartPulse,
    subcategories: ["Skincare", "Makeup", "Fragrances", "Health", "Wellness"],
  },
  {
    name: "Other Categories",
    icon: Package,
    subcategories: ["Books", "Toys", "Beauty", "Other"],
  },
];

// ✅ Now exported so other pages can import it
export function buildCategorySearchUrl(category: Category): string {
  const allCategories = [category.name, ...category.subcategories];
  const categoryParams = allCategories
    .map((cat) => `category=${encodeURIComponent(cat.toLowerCase())}`)
    .join("&");
  return `/Search?${categoryParams}`;
}

// ─── Mobile Grid Component (homepage — small screens only) ───────────────────
export function CategoryGrid() {
  return (
    <div className="block lg:hidden">
      <h2 className="text-sm font-semibold text-muted-foreground text-center mb-4 uppercase tracking-wide">
        Browse by Category
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide container">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.name}
              href={buildCategorySearchUrl(category)}
              className="group flex-shrink-0"
            >
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/30 border border-border hover:border-[#e1a200]/50 hover:bg-[#e1a200]/5 hover:shadow-md transition-all duration-300 w-[72px]">
                <div className="p-2.5 rounded-full bg-background border border-border group-hover:border-[#e1a200]/40 group-hover:bg-[#e1a200]/10 group-hover:scale-110 transition-all duration-300">
                  <Icon className={cn("h-4 w-4 text-[#e1a200]")} />
                </div>
                <span className="text-[9px] font-semibold text-foreground text-center leading-tight line-clamp-2">
                  {category.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── All Screen Grid (for allStoreProducts page) ──────────────────────────────
export function CategoryGridAll() {
  return (
    <div className="w-full">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Browse by Category
      </p>
      {/* Scrollable on mobile, wrapping grid on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-2 lg:overflow-visible lg:flex-wrap scrollbar-hide">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.name}
              href={buildCategorySearchUrl(category)}
              className="group flex-shrink-0 lg:flex-shrink"
            >
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-muted/30 border border-border hover:border-[#e1a200]/50 hover:bg-[#e1a200]/5 hover:shadow-md transition-all duration-300 w-[72px] lg:w-[80px]">
                <div className="p-2.5 rounded-full bg-background border border-border group-hover:border-[#e1a200]/40 group-hover:bg-[#e1a200]/10 group-hover:scale-110 transition-all duration-300">
                  <Icon className={cn("h-4 w-4 lg:h-5 lg:w-5 text-[#e1a200]")} />
                </div>
                <span className="text-[9px] lg:text-[10px] font-semibold text-foreground text-center leading-tight line-clamp-2">
                  {category.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Desktop Sidebar Component (search/product pages) ────────────────────────
export function CategorySidebar() {
  return (
    <aside className="hidden lg:block w-64 bg-background border-border sticky top-16 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-bold text-foreground mb-4 tracking-wide px-3">
          Browse by Category
        </h2>
        <nav className="space-y-1">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.name}
                href={buildCategorySearchUrl(category)}
                className="group"
              >
                <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-all duration-200">
                  <div className="p-2 rounded-lg bg-muted/50 border border-border group-hover:border-[#e1a200]/30 group-hover:bg-[#e1a200]/10 transition-all duration-200">
                    <Icon className="h-5 w-5 text-[#e1a200]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-[#e1a200] transition-colors">
                      {category.name}
                    </p>
                  </div>
                  <svg
                    className="h-4 w-4 text-muted-foreground group-hover:text-[#e1a200] group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}