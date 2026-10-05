// components/home/FeaturedStoresClient.tsx
"use client";

import Link from "next/link";
import { ArrowRight, Store, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isUserInteractingRef = useRef(false);
  const userPauseTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || stores.length === 0) return;

    const maxScroll = () => container.scrollWidth - container.clientWidth;
    if (maxScroll() <= 0) return;

    let rafId = 0;

    const tick = () => {
      if (isUserInteractingRef.current) {
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      const nextScroll = container.scrollLeft + 0.7;
      const limit = maxScroll();

      if (nextScroll >= limit) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft = nextScroll;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (userPauseTimeoutRef.current) {
        window.clearTimeout(userPauseTimeoutRef.current);
      }
    };
  }, [stores]);

  const pauseAutoScroll = () => {
    isUserInteractingRef.current = true;

    if (userPauseTimeoutRef.current) {
      window.clearTimeout(userPauseTimeoutRef.current);
    }

    userPauseTimeoutRef.current = window.setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 260);
  };

  return (
    <section className="relative w-full overflow-hidden border-border/60 bg-background py-6 sm:py-8 lg:py-12">
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
              Popular stores
            </p>
          </div>

          
        </div>

        <div className="relative">
          {stores.length === 0 ? (
            <div className="mx-auto max-w-2xl space-y-6 py-12 text-center sm:space-y-8 sm:py-16 lg:py-20">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted shadow-lg sm:h-24 sm:w-24">
                <Store className="h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
                  No Featured Stores Yet
                </h3>
                <p className="mx-auto max-w-md px-4 text-sm text-muted-foreground sm:text-base">
                  We're working on highlighting our best stores. Check back soon
                  or be the first to get featured!
                </p>
              </div>
              <Link href="/auth/register" className="inline-block">
                <Button
                  size="lg"
                  className="h-11 bg-[#0E5A43] px-6 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl sm:h-12 sm:px-8 lg:h-14 lg:px-10 lg:text-lg"
                >
                  <span className="flex items-center gap-2">
                    Start Your Own Store
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                </Button>
              </Link>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory md:gap-6 lg:gap-8 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              onScroll={pauseAutoScroll}
              onWheel={pauseAutoScroll}
              onTouchStart={pauseAutoScroll}
              onTouchMove={pauseAutoScroll}
              onPointerDown={pauseAutoScroll}
              onPointerUp={() => {
                isUserInteractingRef.current = false;
              }}
            >
              {stores.map((store) => (
                <div
                  key={store._id}
                  className={cn(
                    "group relative min-w-[300px] snap-center transition-all duration-300 hover:z-10 sm:min-w-[420px] md:min-w-[500px] lg:min-w-[660px] xl:min-w-[920px]",
                  )}
                >
                  <div className="relative rounded-xl transition-all duration-300 group-hover:shadow-lg">
                    <StoreCard store={store} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <Link
            href="/stores"
            className="flex items-center text-xs font-medium text-[#0E5A43] transition-colors hover:text-[#147b5c] sm:inline-flex lg:text-sm"
          >
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
