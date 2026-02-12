"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ShoppingBag,
  Store,
  Smartphone,
  Laptop,
  Home,
  Car,
  Shirt,
  Package,
  ShieldCheck,
  UserCheck,
  Headset,
  ChefHat,
} from "lucide-react";
import { Reveal } from "../Reveal";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { name: "Electronics", icon: Smartphone, color: "text-blue-600" },
  { name: "Vehicles", icon: Car, color: "text-orange-600" },
  { name: "Fashion", icon: Shirt, color: "text-purple-600" },
  { name: "Home & furniture", icon: Home, color: "text-green-600" },
  { name: "Computing", icon: Laptop, color: "text-indigo-600" },
  { name: "More", icon: Package, color: "text-gray-600" },
  { name: "Food & Agriculture", icon: ChefHat, color: "text-green-600" }
];

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/Search?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <Reveal>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-background">
        {/* Minimal background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />

        <div className="container relative z-10 pt-12 px-4 sm:px-6 md:px-8 sm:pt-16 lg:pt-20">
          <div className="max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="text-center space-y-6 sm:space-y-8 mb-10 sm:mb-12">
              {/* Headline */}
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
                  Buy and Sell
                  <span className="block mt-2 bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] bg-clip-text text-transparent">
                    Seamlessly with EasyLife
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Build, customize, and launch your online store in minutes. Join thousands of successful entrepreneurs
                  who trust our platform to grow their business.
                </p>
              </div>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="relative">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products, stores, or categories..."
                    className="h-14 pl-5 pr-29 text-[13px] rounded-full border-2 border-border focus-visible:border-[#e1a200] focus-visible:ring-[#e1a200]/20 shadow-sm"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-auto p-4 rounded-full bg-gradient-to-r from-[#e1a200] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#e1a200] shadow-sm"
                  >
                    <Search className="pointer-events-none" />
                  </Button>
                </form>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2">
                <Link href="/allStoreProducts" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className={cn(
                      "w-full sm:w-auto h-12 px-8 text-base font-semibold",
                      "bg-gradient-to-r from-[#e1a200] to-[#d4b55e]",
                      "hover:from-[#d4b55e] hover:to-[#e1a200]",
                      "shadow-md hover:shadow-lg transition-all",
                    )}
                  >
                    Browse Products
                    <ShoppingBag className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-12 px-8 text-base font-semibold border-2 hover:bg-muted/50 hover:border-[#e1a200]/50 transition-all"
                  >
                    Create Store
                    <Store className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="">
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <UserCheck className="text-emerald-500 w-5 h-5" />
                  <span>Verified Sellers</span>
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>Buyer Protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Headset className="w-5 h-5 text-emerald-500" />
                  <span>Fast Support</span>
                </div>
              </div>
            </div>

            {/* Category Grid */}
            <div className="mb-10 sm:mb-12 mt-10 sm:mt-12 pt-8 border-t border-border">
              <h2 className="text-sm font-semibold text-muted-foreground text-center mb-4 uppercase tracking-wide">
                Browse by Category
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-3 sm:gap-4 max-w-5xl mx-auto">
                {CATEGORIES.map((category) => (
                  <Link
                    key={category.name}
                    href={`/Search?category=${encodeURIComponent(category.name.toLowerCase())}`}
                    className="group"
                  >
                    <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30 border border-border hover:border-[#e1a200]/50 hover:bg-muted/50 transition-all">
                      <div className="p-3 rounded-full bg-background border border-border group-hover:border-[#e1a200]/30 transition-all">
                        <category.icon
                          className={cn("h-5 w-5", category.color)}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground text-center">
                        {category.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}