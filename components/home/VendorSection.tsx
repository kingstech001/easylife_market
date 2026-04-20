"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Rocket,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";

interface StorePreview {
  _id: string;
  businessName?: string;
  name?: string;
  logo?: string;
  logo_url?: string;
  slug?: string;
}

const benefits = [
  {
    icon: Store,
    title: "Launch in minutes",
    description: "Set up a branded storefront quickly without needing technical experience.",
  },
  {
    icon: BarChart3,
    title: "Run operations simply",
    description: "Manage products, orders, and inventory from one clear seller dashboard.",
  },
  {
    icon: Users,
    title: "Reach more customers",
    description: "Get discovered by active shoppers already searching across the marketplace.",
  },
  {
    icon: TrendingUp,
    title: "Grow with confidence",
    description: "Use practical tools and insights to increase sales and scale steadily.",
  },
];

const trustPoints = ["Free to start", "No setup fees", "Easy dashboard", "Instant payouts"];

export function VendorSection() {
  const [storePreviews, setStorePreviews] = useState<StorePreview[]>([]);

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch("/api/stores?limit=5", { cache: "no-store" });
        if (!res.ok) {
          return;
        }

        const data = await res.json();
        const stores: StorePreview[] = Array.isArray(data)
          ? data
          : data.stores || data.data || [];

        setStorePreviews(stores.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch store previews:", err);
      }
    }

    fetchStores();
  }, []);

  const sellerPreview = useMemo(() => storePreviews.slice(0, 5), [storePreviews]);

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background))_0%,rgba(225,162,0,0.05)_26%,hsl(var(--muted)/0.22)_68%,hsl(var(--background))_100%)]" />
      <div className="absolute inset-0 opacity-[0.04]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.18) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>
      <div className="absolute left-[-10%] top-8 h-48 w-48 rounded-full bg-[#e1a200]/12 blur-3xl sm:h-64 sm:w-64" />
      <div className="absolute bottom-0 right-[-8%] h-56 w-56 rounded-full bg-[#d4b55e]/12 blur-3xl sm:h-72 sm:w-72" />

      <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-10">
          <div className="space-y-6 sm:space-y-7">
            <Badge className="inline-flex border-0 bg-gradient-to-r from-[#e1a200] to-[#d4b55e] px-4 py-2 text-sm font-semibold text-white shadow-sm">
              <Rocket className="mr-2 h-4 w-4" />
              For Vendors
            </Badge>

            <div className="space-y-4">
              <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-6xl">
                Turn your passion into
                <span className="mt-2 block bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] bg-clip-text text-transparent">
                  profit with a professional storefront
                </span>
              </h2>

              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base lg:text-lg">
                Launch your online store in minutes, add products easily, manage orders without stress,
                and reach more customers from one seller-friendly dashboard built for growth.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6500]">
                  Setup
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">Fast launch</p>
                <p className="mt-1 text-sm text-muted-foreground">Start selling without technical friction.</p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6500]">
                  Control
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">Simple management</p>
                <p className="mt-1 text-sm text-muted-foreground">Track inventory and orders in one place.</p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6500]">
                  Growth
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">More visibility</p>
                <p className="mt-1 text-sm text-muted-foreground">Reach buyers already browsing the marketplace.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="h-12 w-full rounded-full bg-[#e1a200] px-6 text-base font-semibold text-white shadow-lg shadow-[#e1a200]/20 hover:bg-[#c89100] sm:h-14 sm:w-auto sm:px-8"
                >
                  Create Your Store
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href="/stores" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 w-full rounded-full border-border bg-background/85 px-6 text-base font-semibold hover:border-[#e1a200]/45 hover:bg-[#e1a200]/[0.05] sm:h-14 sm:w-auto sm:px-8"
                >
                  See Success Stories
                </Button>
              </Link>
            </div>

            <div className="rounded-[28px] border border-border/70 bg-background/80 p-4 shadow-sm backdrop-blur sm:p-5">
              <p className="text-sm font-medium text-muted-foreground">
                Join thousands of successful sellers already growing on EasyLife.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {trustPoints.map((label) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-2 text-sm text-foreground"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div className="rounded-[32px] border border-border/70 bg-background/85 p-5 shadow-xl backdrop-blur sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6500]">
                    Seller benefits
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
                    Everything you need to sell with confidence
                  </h3>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:gap-4">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;

                  return (
                    <div
                      key={benefit.title}
                      className="rounded-3xl border border-border/70 bg-muted/25 p-4 transition hover:border-[#e1a200]/35 hover:bg-[#e1a200]/[0.04]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e1a200] to-[#d4b55e] text-white shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-foreground">{benefit.title}</h4>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[32px] border border-[#e1a200]/15 bg-[linear-gradient(135deg,rgba(225,162,0,0.1),rgba(225,162,0,0.03)_48%,rgba(255,255,255,0.72)_100%)] p-5 shadow-sm sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6500]">
                Social proof
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex -space-x-3">
                  {sellerPreview.length > 0
                    ? sellerPreview.map((store, i) => {
                        const logoUrl = store.logo || store.logo_url;
                        const displayName = store.businessName || store.name || "Seller";
                        const initial = displayName.charAt(0).toUpperCase();

                        return (
                          <div
                            key={store._id}
                            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-gradient-to-br from-[#e1a200] to-[#d4b55e] shadow-sm"
                            title={displayName}
                            style={{ zIndex: sellerPreview.length - i }}
                          >
                            {logoUrl ? (
                              <Image
                                src={logoUrl}
                                alt={displayName}
                                width={44}
                                height={44}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-white">{initial}</span>
                            )}
                          </div>
                        );
                      })
                    : Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-11 w-11 rounded-full border-2 border-background bg-gradient-to-br from-[#e1a200]/40 to-[#d4b55e]/40 shadow-sm animate-pulse"
                          style={{ zIndex: 5 - i }}
                        />
                      ))}
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">5,000+ active sellers</p>
                  <p className="text-sm text-muted-foreground">
                    Trusted by growing businesses across categories.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
