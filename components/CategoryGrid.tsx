"use client";

import Link from "next/link";
import type { ElementType } from "react";
import {
  Smartphone,
  Package,
  Tv,
  HeartPulse,
  Apple,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import PotOfFoodIcon from "@iconify-react/emojione-v1/pot-of-food";
import ElectronicsIcon from "@iconify-react/flat-color-icons/electronics";
import WomenClothesIcon from "@iconify-react/fluent-emoji-flat/womans-clothes";
import MobilePhoneIcon from "@iconify-react/emojione-v1/mobile-phone";
import ShoppingBagsIcon from "@iconify-react/emojione-v1/shopping-bags";
import LipstickIcon from "@iconify-react/emojione-v1/lipstick";

// Category type definition
export type Category = {
  name: string;
  icon: ElementType;
  subcategories: string[];
};

// Categories data
// (subcategories double as search keywords, so the odd casing/duplicates are left as-is)
export const CATEGORIES: Category[] = [
  {
    name: "Restaurants",
    icon: PotOfFoodIcon,
    subcategories: [
      "Fast Food",
      "Fine Dining",
      "Cafes",
      "Bakeries",
      "food",
      "restaurants",
    ],
  },
  {
    name: "Electronics",
    icon: ElectronicsIcon,
    subcategories: [
      "Television",
      "Cameras & Photo",
      "Home Audio",
      "Tv",
      "electronics",
    ],
  },
  {
    name: "Fashion",
    icon: WomenClothesIcon,
    subcategories: [
      "Clothing",
      "Shoes",
      "Accessories",
      "Jewelry",
      "Bags",
      "game wear",
      "sportswear",
    ],
  },
  {
    name: "Phones",
    icon: MobilePhoneIcon,
    subcategories: ["Smartphones", "Tablets", "Accessories", "Smart Watches"],
  },
  {
    name: "Supermarket",
    icon: ShoppingBagsIcon,
    subcategories: [
      "Groceries",
      "Fresh Produce",
      "Farm Tools",
      "Food",
      "Beverages",
      "drinks",
      "wine",
      "beer",
      "snacks",
    ],
  },
  {
    name: "Beauty",
    icon: LipstickIcon,
    subcategories: ["Skincare", "Makeup", "Fragrances", "Health", "Wellness"],
  },
  {
    name: "Other",
    icon: Package,
    subcategories: ["Books", "Toys", "Beauty", "Other"],
  },
];

// Exported so other pages can import it
export function buildCategorySearchUrl(category: Category): string {
  const allCategories = [category.name, ...category.subcategories];
  const categoryParams = allCategories
    .map((cat) => `category=${encodeURIComponent(cat.toLowerCase())}`)
    .join("&");
  return `/Search?${categoryParams}`;
}

const hideScrollbar =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A43]/40";

// ─── Mobile row (homepage, small screens) ────────────────────────────────────
export function CategoryGrid() {
  return (
    <section
      aria-labelledby="shop-by-category"
      className="w-full px-4 py-5 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-3 flex items-baseline justify-between">
          <h2
            id="shop-by-category"
            className="text-base font-semibold text-foreground"
          >
            Shop by category
          </h2>
          <Link
            href="/stores"
            className="flex items-center text-xs font-medium text-[#0E5A43] transition-colors hover:text-[#147b5c] sm:inline-flex lg:text-sm"
          >
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {/* Negative margin lets the row scroll edge-to-edge while still lining up with the page padding */}
        <ul
          className={`-mx-4 flex snap-x gap-1 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${hideScrollbar}`}
        >
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <li key={category.name} className="shrink-0 snap-start">
                <Link
                  href={buildCategorySearchUrl(category)}
                  className={`group flex w-[74px] flex-col items-center gap-2 rounded-xl p-1.5 text-center ${focusRing}`}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-foreground/70 transition-colors duration-150 group-hover:bg-[#0E5A43] group-hover:text-white group-active:bg-[#0E5A43] group-active:text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="line-clamp-2 text-xs font-medium leading-tight text-foreground/90">
                    {category.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

// ─── Chip bar (allStoreProducts page) ────────────────────────────────────────
// Scrolls sideways on small screens, wraps on desktop.
export function CategoryGridAll() {
  return (
    <nav aria-label="Product categories" className="w-full">
      <p className="mb-2.5 text-sm font-semibold text-foreground">Categories</p>
      <ul
        className={`flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible ${hideScrollbar}`}
      >
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <li key={category.name} className="shrink-0">
              <Link
                href={buildCategorySearchUrl(category)}
                className={`group inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-background pl-3.5 pr-4 text-sm font-medium text-foreground/85 transition-colors hover:border-[#0E5A43] hover:text-[#0E5A43] dark:hover:border-emerald-400 dark:hover:text-emerald-400 ${focusRing}`}
              >
                <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-current" />
                {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ─── Desktop sidebar (search / product pages) ────────────────────────────────
export function CategorySidebar() {
  return (
    <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-60 shrink-0 self-start overflow-y-auto rounded-xl border border-border bg-card lg:block">
      <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
        Categories
      </h2>

      <nav aria-label="Categories" className="p-1.5">
        <ul>
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <li key={category.name}>
                <Link
                  href={buildCategorySearchUrl(category)}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground ${focusRing}`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-[#0E5A43] dark:group-hover:text-emerald-400" />
                  <span className="flex-1 truncate">{category.name}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
