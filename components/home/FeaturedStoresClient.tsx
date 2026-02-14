// components/home/FeaturedStoresClient.tsx
"use client";

import Link from "next/link";
import { ArrowRight, Star, TrendingUp, Users, Store, Award, Sparkles, CheckCircle } from "lucide-react";
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
    <section className="relative w-full py-12 sm:py-16 lg:py-24 overflow-hidden">
      {/* Simplified background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
      
      {/* Reduced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#e1a200]/5 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-60" />
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_110%)] opacity-10" />

      <div className="container relative z-10 px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center space-y-6 text-center mb-16">
          {/* Badge */}
          <Badge
            variant="secondary"
            className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#e1a200]/10 to-primary/10 text-foreground border-[#e1a200]/30 transition-all duration-300 hover:shadow-md"
          >
            <Award className="w-4 h-4 mr-2 text-[#e1a200]" />
            Top Performing Stores
          </Badge>

          {/* Main heading */}
          <div className="space-y-4 max-w-4xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Featured{" "}
              </span>
              <span className="bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-primary bg-clip-text text-transparent">
                Success Stories
              </span>
            </h2>
            <p className="max-w-2xl mx-auto text-muted-foreground text-lg leading-relaxed">
              Discover amazing stores built by entrepreneurs like you. Get inspired and start your journey today.
            </p>
          </div>

          {/* Stats bar */}
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-6">
              {[
                { icon: Store, label: "Live stores", value: "2,847", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
                { icon: TrendingUp, label: "Avg. growth", value: "+156%", color: "text-[#e1a200]", bgColor: "bg-[#e1a200]/10" },
                { icon: Users, label: "Happy customers", value: "50K+", color: "text-blue-500", bgColor: "bg-blue-500/10" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="group p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 hover:border-[#e1a200]/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                    <div className={cn(
                      "p-2.5 sm:p-3 rounded-xl transition-transform duration-300 group-hover:scale-110",
                      stat.bgColor
                    )}>
                      <stat.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", stat.color)} />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                  We're working on highlighting our best stores. Check back soon or be the first to get featured!
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stores.map((store, index) => (
                <div
                  key={store._id}
                  className={cn(
                    "group relative transition-all duration-500 hover:z-10",
                    index === 1 && "md:scale-[1.02] lg:scale-105"
                  )}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-[#e1a200]/20 via-transparent to-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Featured badge for middle card */}
                  {index === 2 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                      <Badge className="bg-gradient-to-r from-[#e1a200] to-[#d4b55e] text-white shadow-lg px-3 py-1">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        <span className="text-xs sm:text-sm font-semibold">Featured</span>
                      </Badge>
                    </div>
                  )}

                  {/* Store card wrapper */}
                  <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl p-1 transition-all duration-300 group-hover:from-card/90 group-hover:to-card/60 group-hover:border-[#e1a200]/30 group-hover:shadow-2xl hover:scale-[1.02] sm:hover:scale-105">
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
          <div className="text-center space-y-4 sm:space-y-5 max-w-2xl px-4">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-foreground via-[#e1a200] to-foreground bg-clip-text text-transparent">
              Ready to Join These Success Stories?
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
              Start your journey today and become our next featured store
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2 sm:pt-3">
              {["Free Trial", "Easy Setup", "24/7 Support"].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
                >
                  <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center pt-4 sm:pt-6 w-full max-w-md mx-auto sm:max-w-none">
              <Link href="/stores" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base lg:text-lg font-semibold bg-background/80 backdrop-blur-sm border-2 border-border/50 hover:border-[#e1a200]/50 hover:bg-muted/50 hover:shadow-lg transition-all"
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
                  className="w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 lg:px-10 text-sm sm:text-base lg:text-lg font-semibold bg-gradient-to-r from-[#e1a200] via-[#d4b55e] to-[#e1a200] shadow-lg hover:shadow-xl transition-all"
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