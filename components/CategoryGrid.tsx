"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Smartphone,
  Car,
  Shirt,
  Home,
  Laptop,
  ChefHat,
  Package,
} from "lucide-react";

// Category type definition
type Category = {
  name: string;
  icon: any;
  color: string;
  subcategories: string[];
};

// Categories data
export const CATEGORIES: Category[] = [
  {
    name: "Electronics",
    icon: Smartphone,
    color: "text-blue-600",
    subcategories: ["Phones", "Laptops", "Audio", "Cameras"],
  },
  {
    name: "Vehicles",
    icon: Car,
    color: "text-orange-600",
    subcategories: ["Cars", "Motorbikes", "Trucks", "Spare Parts"],
  },
  {
    name: "Fashion",
    icon: Shirt,
    color: "text-purple-600",
    subcategories: ["Clothing", "Shoes", "Accessories", "Jewelry", "Bags"],
  },
  {
    name: "Home & Furniture",
    icon: Home,
    color: "text-green-600",
    subcategories: ["Furniture", "Decor", "Kitchen", "Garden Tools"],
  },
  {
    name: "Computing",
    icon: Laptop,
    color: "text-indigo-600",
    subcategories: ["Laptops", "Desktops", "Peripherals", "Software"],
  },
  {
    name: "Food & Agriculture",
    icon: ChefHat,
    color: "text-green-600",
    subcategories: ["Groceries", "Fresh Produce", "Farm Tools"],
  },
  {
    name: "More",
    icon: Package,
    color: "text-gray-600",
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

export function CategoryGrid() {
  return (
    <div className="mb-10 sm:mb-12 mt-10 sm:mt-12 pt-8 border-t border-border">
      <h2 className="text-sm font-semibold text-muted-foreground text-center mb-6 uppercase tracking-wide">
        Browse by Category
      </h2>
      
      <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6 max-w-7xl mx-auto">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          
          return (
            <Link
              key={category.name}
              href={buildCategorySearchUrl(category)}
              className="group"
            >
              <div className="flex flex-col items-center gap-3 p-2 rounded-2xl bg-muted/30 border border-border hover:border-[#e1a200]/50 hover:bg-muted/50 hover:shadow-md transition-all duration-300">
                {/* Icon Container */}
                <div className="p-4 rounded-full bg-background border border-border group-hover:border-[#e1a200]/30 group-hover:scale-110 transition-all duration-300">
                  <Icon className={cn("h-6 w-6", category.color)} />
                </div>
                
                {/* Category Name */}
              </div>
                <div className="text-center space-y-1 mt-1">
                  <span className="text-[10px] font-semibold text-foreground block">
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