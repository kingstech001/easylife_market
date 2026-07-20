// components/home/FeaturedStoresClient.tsx
"use client";

import Link from "next/link";
import { ArrowRight, Store, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoreCard } from "@/components/store-card";
import { cn } from "@/lib/utils";

interface DaySchedule {
  open: boolean;
  openTime: string;
  closeTime: string;
}

interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

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
  businessHours?: BusinessHours | null;
  createdAt: string;
  updatedAt: string;
}

interface FeaturedStoresClientProps {
  stores: StoreData[];
}

export function FeaturedStoresClient({ stores }: FeaturedStoresClientProps) {
  return (
    <section className="relative mt-8 w-full overflow-hidden">
      {/* Simplified background */}

      {/* Reduced animated background elements */}
      <div className="absolute  inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#0E5A43]/5 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-60" />
      </div>

      {/* Subtle grid pattern */}

      <div className="container relative z-10 px-4 sm:px-6 mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between text-center mb-8  ">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="px-4 py-2 text-sm font-semibold bg-[#0E5A43] text-white border-[#0E5A43]/30 transition-all duration-300 hover:shadow-md"
          >
            <Sparkles className="w-4 h-4 mr-2 text-[#0E5A43]" />
            New Featured Stores
          </Badge>
          <Link
            href="/stores"
            className="flex items-center text-xs md:text-sm font-medium text-[#0E5A43] hover:text-[#F4C430] transition-colors"
          >
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {/* Store Cards Grid */}
        <div className="relative">
          {stores.length === 0 ? (
            <div className="text-center py-12 sm:py-16 lg:py-20 space-y-6 sm:space-y-8 max-w-2xl mx-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-muted flex items-center justify-center shadow-lg">
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
                  className="h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base lg:text-lg font-semibold bg-[#0E5A43] text-white shadow-lg hover:shadow-xl transition-all"
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
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 lg:h-32 bg-background pointer-events-none" />
    </section>
  );
}
