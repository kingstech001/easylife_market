// components/home/FeaturedPromoCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CreditCard,
  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Edit the copy here ───────────────────────────────────────────────────────
const EYEBROW = "Welcome to EasyLife";
const HEADLINE_START = "Shop trusted local stores,";
const HEADLINE_HIGHLIGHT = "delivered";
const HEADLINE_END = "to you.";

const PRIMARY_CTA = { label: "Start shopping", href: "/allStoreProducts" };
const SECONDARY_CTA = { label: "Sell on EasyLife", href: "/auth/register" };

const FEATURES: { icon: LucideIcon; top: string; bottom: string }[] = [
  { icon: ShieldCheck, top: "Verified", bottom: "stores" },
  { icon: CreditCard, top: "Secure", bottom: "payments" },
  { icon: Truck, top: "Doorstep", bottom: "delivery" },
  { icon: MessageCircle, top: "Order on", bottom: "WhatsApp" },
];

// Floating glass tiles around the phone (positions are % of the visual area)
const TILES: {
  icon: LucideIcon;
  className: string;
  tone: "gold" | "glass" | "emerald";
}[] = [
  { icon: Tag, className: "left-[6%] top-[10%] -rotate-12", tone: "gold" },
  { icon: ShoppingCart, className: "right-[4%] top-[6%] rotate-12", tone: "glass" },
  { icon: Truck, className: "right-[0%] top-[42%] -rotate-6", tone: "emerald" },
  { icon: Star, className: "left-[2%] bottom-[18%] rotate-6", tone: "glass" },
  { icon: Package, className: "right-[10%] bottom-[8%] rotate-[14deg]", tone: "gold" },
];

const TONES = {
  gold: "bg-gradient-to-br from-[#f6cf66] to-[#c9971c] text-[#083B2D] border-white/40",
  glass: "bg-gradient-to-br from-white/30 to-white/10 text-white border-white/30",
  emerald: "bg-gradient-to-br from-emerald-300/70 to-emerald-600/50 text-white border-white/30",
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E5A43]";

export function FeaturedPromoCard({ isClone = false }: { isClone?: boolean }) {
  // The carousel duplicates cards for its endless loop; keep the hidden copies out of the tab order
  const tabIndex = isClone ? -1 : undefined;

  return (
    <div className="relative flex h-full min-h-[210px] flex-col justify-center overflow-hidden rounded-2xl bg-[#0E5A43] p-5 text-white sm:p-7 lg:p-9 xl:p-12">
      {/* Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#0E5A43_0%,#083B2D_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(246,207,102,0.20),transparent_45%),radial-gradient(circle_at_0%_100%,rgba(255,255,255,0.10),transparent_40%)]" />
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: "url('/pattern.svg')",
            backgroundRepeat: "repeat",
            backgroundSize: "420px 420px",
          }}
        />
      </div>

      {/* Copy */}
      <div className="relative z-10 md:max-w-[56%]">
        <p className="inline-block border-b border-white/20 pb-1 text-xs font-medium tracking-wide text-white/80 sm:text-sm">
          {EYEBROW}
        </p>

        <h2 className="mt-3 text-xl font-bold leading-[1.15] tracking-tight sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
          {HEADLINE_START}{" "}
          <span className="text-[#f6cf66]">{HEADLINE_HIGHLIGHT}</span>{" "}
          {HEADLINE_END}
        </h2>

        <ul className="mt-5 hidden grid-cols-2 gap-x-4 gap-y-3 sm:grid xl:grid-cols-4 xl:gap-x-5">
          {FEATURES.map(({ icon: Icon, top, bottom }) => (
            <li key={top} className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                <Icon className="h-4 w-4 text-[#f6cf66]" strokeWidth={1.75} />
              </span>
              <span className="text-xs leading-tight text-white/85">
                {top}
                <br />
                {bottom}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-6">
          <Link
            href={PRIMARY_CTA.href}
            tabIndex={tabIndex}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-lg bg-[#f6cf66] px-5 text-sm font-semibold text-[#083B2D] transition-colors hover:bg-[#ffd978] sm:h-11 sm:px-6",
              focusRing,
            )}
          >
            {PRIMARY_CTA.label}
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href={SECONDARY_CTA.href}
            tabIndex={tabIndex}
            className={cn(
              "hidden h-11 items-center rounded-lg border border-white/30 px-5 text-sm font-medium text-white transition-colors hover:bg-white/10 sm:inline-flex",
              focusRing,
            )}
          >
            {SECONDARY_CTA.label}
          </Link>
        </div>
      </div>

      {/* Visual: phone + floating tiles (decorative, desktop/tablet only) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] items-center justify-center md:flex"
      >
        {/* Glow under the phone */}
        <div className="absolute bottom-[3%] left-1/2 h-[14%] w-[78%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(246,207,102,0.5),transparent_70%)] blur-sm" />

        {/* Phone */}
        <div className="relative aspect-[9/18] h-[86%] rotate-[7deg] rounded-[2rem] border-[3px] border-white/25 bg-gradient-to-b from-[#0b4d3a] to-[#062b21] p-[3%] shadow-2xl shadow-black/40">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-[#12805f] to-[#083B2D]">
            <span className="absolute left-1/2 top-2 h-1.5 w-1/4 -translate-x-1/2 rounded-full bg-black/50" />
            <Image
              src="/logo.png"
              alt=""
              width={96}
              height={96}
              priority={!isClone}
              className="h-auto w-1/2 drop-shadow-lg"
            />
          </div>
        </div>

        {/* Floating tiles */}
        {TILES.map(({ icon: Icon, className, tone }, i) => (
          <span
            key={i}
            className={cn(
              "absolute flex aspect-square h-[19%] items-center justify-center rounded-[22%] border shadow-lg backdrop-blur-sm",
              TONES[tone],
              className,
            )}
          >
            <Icon className="h-1/2 w-1/2" strokeWidth={1.75} />
          </span>
        ))}
      </div>
    </div>
  );
}