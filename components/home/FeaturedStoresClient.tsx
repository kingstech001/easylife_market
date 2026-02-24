// components/home/FeaturedStoresClient.tsx
"use client";

import Link from "next/link";
import {
  ArrowRight,
  Star,
  TrendingUp,
  Users,
  Store,
  Award,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoreCard } from "@/components/store-card";
import { cn } from "@/lib/utils";

interface StoreData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  sellerId: string;
  isPublished: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface FeaturedStoresClientProps {
  stores: StoreData[];
}

export function FeaturedStoresClient({ stores }: FeaturedStoresClientProps) {
  return (
    <section className="relative w-full py-12 sm:py-16 overflow-hidden">
      {/* Simplified background */}

      {/* Reduced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#e1a200]/5 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-60" />
      </div>

      {/* Subtle grid pattern */}

      <div className="container relative z-10 px-4 sm:px-6 mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between text-center mb-16">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#e1a200]/10 to-primary/10 text-foreground border-[#e1a200]/30 transition-all duration-300 hover:shadow-md"
          >
            <Sparkles className="w-4 h-4 mr-2 text-[#e1a200]" />
            New Featured Stores
          </Badge>
          <Link
            href="/stores"
            className="flex items-center text-xs md:text-sm font-medium text-[#e1a200] hover:text-[#d4b55e] transition-colors"
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {/* Store Cards Grid */}
        <div className="relative">
          {stores.length === 0 ? (
            <div className="text-center py-12 sm:py-16 lg:py-20 space-y-6 sm:space-y-8 max-w-2xl mx-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shadow-lg">
                <Store className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                  No Featured Stores Yet
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-4">
                  We're working on highlighting our best stores. Check back soon
                  or be the first to get featured!
                </p>
              </div>
              <Link href="/auth/register" className="inline-block">
                <Button
                  size="lg"
                  className="h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base lg:text-lg font-semibold bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] shadow-lg hover:shadow-xl transition-all"
                >
                  <span className="flex items-center gap-2">
                    Start Your Own Store
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto md:overflow-x-visible md:grid md:grid-cols-2 lg:grid-cols-4 pb-4 md:pb-0 snap-x snap-mandatory md:snap-none">
              {stores.map((store, index) => (
                <div
                  key={store._id}
                  className={cn(
                    "group relative transition-all duration-500",
                    // Mobile: fixed width for horizontal scroll
                    "min-w-[280px] sm:min-w-[320px] snap-center",
                    // Desktop: auto width from grid
                    "md:min-w-0 md:w-auto",
                    // Hover effects
                    "hover:z-10",
                  )}
                >
                  {/* Store card wrapper */}
                  <div className="relative rounded-2xl sm:rounded-3xl p-1 transition-all duration-300 group-hover:shadow-2xl hover:scale-[1.02]">
                    <StoreCard store={store} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center justify-center space-y-6 sm:space-y-8 mt-12">
          {/* Decorative divider */}
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
            <div className="p-2 sm:p-2.5 rounded-full bg-gradient-to-br from-[#e1a200]/20 to-primary/20 shadow-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#e1a200]" />
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-border via-border to-transparent" />
          </div>

          {/* CTA Content */}
          <div className="text-center space-y-4 sm:space-y-5 max-w-2xl">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground via-[#e1a200] to-foreground bg-clip-text text-transparent">
              Ready to Join These Success Stories?
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              Start your journey today and become our next featured store
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 sm:pt-3">
              {["Free Trial", "Easy Setup", "24/7 Support"].map(
                (item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {item}
                    </span>
                  </div>
                ),
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center pt-4 sm:pt-6 w-full max-w-md mx-auto sm:max-w-none">
              <Link href="/stores" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base lg:text-lg font-semibold bg-background/80 backdrop-blur-sm border-2 border-border/50 hover:border-[#e1a200]/50 hover:bg-muted/50 hover:shadow-lg transition-all rounded-full"
                >
                  <span className="flex items-center justify-center gap-2">
                    Explore All Stores
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              </Link>
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base lg:text-lg font-semibold bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] shadow-lg hover:shadow-xl transition-all rounded-full"
                >
                  <span className="flex items-center justify-center gap-2">
                    Start Your Store
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 lg:h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
