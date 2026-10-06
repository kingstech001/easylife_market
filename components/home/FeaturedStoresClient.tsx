// components/home/FeaturedStoresClient.tsx
"use client";

import Link from "next/link";
import { ArrowRight, Store, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { StoreCard } from "@/components/store-card";

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

const SPEED_PX_PER_SEC = 40;
const RESUME_DELAY_MS = 1500;
const DRAG_THRESHOLD_PX = 6;

export function FeaturedStoresClient({ stores }: FeaturedStoresClientProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef(0);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false });

  // Only duplicate the list (for a seamless loop) when it actually overflows
  const [loop, setLoop] = useState(false);

  // Distance of one full "set" of cards (card widths + gaps)
  const getPeriod = () => {
    const el = scrollRef.current;
    if (!el || !loop) return 0;
    const first = el.children[0] as HTMLElement | undefined;
    const second = el.children[stores.length] as HTMLElement | undefined;
    if (!first || !second) return 0;
    return second.offsetLeft - first.offsetLeft;
  };

  // Decide if content overflows enough to need looping
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || stores.length === 0) return;

    const check = () => {
      const last = el.children[stores.length - 1] as HTMLElement | undefined;
      const first = el.children[0] as HTMLElement | undefined;
      if (!first || !last) return;
      const setWidth = last.offsetLeft + last.offsetWidth - first.offsetLeft;
      setLoop(setWidth > el.clientWidth + 4);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [stores]);

  // Auto-scroll animation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !loop) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduceMotion) return;

    let rafId = 0;
    let last = performance.now();
    posRef.current = el.scrollLeft;

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64); // clamp when tab was inactive
      last = now;

      if (pausedRef.current) {
        posRef.current = el.scrollLeft; // stay in sync with user scrolling
      } else {
        const period = getPeriod();
        posRef.current += (SPEED_PX_PER_SEC * dt) / 1000;
        if (period > 0 && posRef.current >= period) posRef.current -= period;
        el.scrollLeft = posRef.current;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop, stores]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const pause = () => {
    pausedRef.current = true;
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
  };

  const resumeSoon = (delay = RESUME_DELAY_MS) => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      pausedRef.current = false;
    }, delay);
  };

  // Keep the loop seamless when the user scrolls manually past either edge
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !loop || !pausedRef.current) return;
    const period = getPeriod();
    if (period <= 0) return;
    if (el.scrollLeft >= period) el.scrollLeft -= period;
    else if (el.scrollLeft <= 0) el.scrollLeft += period;
  };

  // Mouse drag-to-scroll (touch already scrolls natively)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = scrollRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    pause();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = scrollRef.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) d.moved = true;
    if (d.moved) el.scrollLeft = d.startScroll - dx;
  };

  const endDrag = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    resumeSoon(800);
    // reset "moved" after the click event has had a chance to fire
    window.setTimeout(() => {
      drag.current.moved = false;
    }, 0);
  };

  // If the user dragged, cancel the click so we don't navigate by accident
  const onClickCapture = (e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const renderedStores = loop ? [...stores, ...stores] : stores;

  return (
    <section className="relative w-full overflow-hidden border-border/60 bg-background py-6 sm:py-8 lg:py-12">
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
            Popular stores
          </p>
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
                  We&apos;re working on highlighting our best stores. Check back
                  soon or be the first to get featured!
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
              className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 md:gap-6 md:pb-0 lg:gap-8 cursor-grab active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              onScroll={handleScroll}
              // Pause while hovering / interacting
              onMouseEnter={pause}
              onMouseLeave={() => {
                if (!drag.current.active) resumeSoon(300);
              }}
              onTouchStart={pause}
              onTouchEnd={() => resumeSoon()}
              onTouchCancel={() => resumeSoon()}
              onWheel={() => {
                pause();
                resumeSoon();
              }}
              // Mouse drag
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onClickCapture={onClickCapture}
              onDragStart={(e) => e.preventDefault()}
            >
              {renderedStores.map((store, i) => {
                const isClone = i >= stores.length;
                return (
                  <div
                    key={`${store._id}-${isClone ? "b" : "a"}`}
                    aria-hidden={isClone || undefined}
                    className="group relative min-w-[300px] shrink-0 transition-all duration-300 hover:z-10 sm:min-w-[420px] md:min-w-[500px] lg:min-w-[660px] xl:min-w-[920px]"
                  >
                    <div className="relative rounded-xl transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                      <StoreCard store={store} />
                    </div>
                  </div>
                );
              })}
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