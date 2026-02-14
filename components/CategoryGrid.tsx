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
} from "lucide-react";

// Category type definition
type Category = {
  name: string;
  icon: any;
  subcategories: string[];
};

// Categories data
export const CATEGORIES: Category[] = [
  {
    name: "Electronics",
    icon: Tv,
    subcategories: ["Television", "Cameras & Photo", "Home Audio"],
  },
  {
    name: "Vehicles",
    icon: Car,
    subcategories: ["Cars", "Motorbikes", "Trucks", "Spare Parts"],
  },
  {
    name: "Fashion",
    icon: Shirt,
    subcategories: ["Clothing", "Shoes", "Accessories", "Jewelry", "Bags"],
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

// Helper function to build search URL with category and subcategories
function buildCategorySearchUrl(category: Category): string {
  const allCategories = [category.name, ...category.subcategories];
  const categoryParams = allCategories
    .map((cat) => `category=${encodeURIComponent(cat.toLowerCase())}`)
    .join("&");

  return `/Search?${categoryParams}`;
}

// Mobile Grid Component (for homepage)
export function CategoryGrid() {
  return (
    <div className="block lg:hidden mb-10 sm:mb-12 mt-10 sm:mt-12 pt-8 border-t border-border">
      <h2 className="text-sm font-semibold text-muted-foreground text-center mb-6 uppercase tracking-wide">
        Browse by Category
      </h2>

      <div className="flex gap-4 overflow-hidden overflow-x-auto container">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;

          return (
            <Link
              key={category.name}
              href={buildCategorySearchUrl(category)}
              className="group"
            >
              <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/30 border border-border hover:border-[#e1a200]/50 hover:bg-muted/50 hover:shadow-md transition-all duration-300">
                {/* Icon Container */}
                <div className="p-3 rounded-full bg-background border border-border group-hover:border-[#e1a200]/30 group-hover:scale-110 transition-all duration-300">
                  <Icon className={cn("h-5 w-5 text-[#e1a200]")} />
                </div>

              </div>
                {/* Category Name */}
                <div className="text-center">
                  <span className="text-[10px] font-semibold text-foreground block leading-tight">
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

// Desktop Sidebar Component (for search/product pages)
export function CategorySidebar() {
  return (
    <aside className="hidden lg:block w-64 bg-background border- border-border  sticky top-16 overflow-y-auto">
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
                  {/* Icon */}
                  <div className="p-2 rounded-lg bg-muted/50 border border-border group-hover:border-[#e1a200]/30 group-hover:bg-[#e1a200]/10 transition-all duration-200">
                    <Icon className="h-5 w-5 text-[#e1a200]" />
                  </div>

                  {/* Category Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-[#e1a200] transition-colors">
                      {category.name}
                    </p>
                  </div>

                  {/* Arrow indicator */}
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