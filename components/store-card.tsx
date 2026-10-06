"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoreStatus, type BusinessHours } from "@/lib/store-hours";
import { cn } from "@/lib/utils";

interface StoreCardProps {
  store: {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
    banner_url?: string;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    productCount?: number;
    businessHours?: BusinessHours | null;
  };
  variant?: "default" | "compact";
}

export function StoreCard({ store, variant = "default" }: StoreCardProps) {
  const status = getStoreStatus(store.businessHours);
  const compact = variant === "compact";

  return (
    <Link href={`/stores/${store.slug}`} className="block h-full w-full">
      <Card className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/60 p-0 transition-all duration-300 hover:border-primary/50 hover:shadow-xl">
        <div className="relative">
          <div
            className={cn(
              "relative w-full flex-shrink-0 overflow-hidden bg-muted p-0",
              compact
                ? "h-24 sm:h-28 lg:h-32"
                : "h-32 sm:h-36 md:h-40 lg:h-52 xl:h-64",
            )}
          >
            {store.banner_url ? (
              <Image
                src={store.banner_url}
                alt={`${store.name} banner`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 280px, (max-width: 1024px) 50vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground/60">
                No Banner Image
              </div>
            )}

            {!status.isOpen && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0 text-white/80" />
                  <span className="text-xs font-semibold text-white">
                    {status.detail}
                  </span>
                </div>
              </div>
            )}

            {!store.isPublished && (
              <Badge className="absolute right-2 top-2 bg-red-500 text-white">
                Draft
              </Badge>
            )}
          </div>

          {store.logo_url && (
            <div className="absolute bottom-0 left-4 z-20 translate-y-1/2 overflow-hidden rounded-full border-4 border-card bg-card shadow-md">
              <div
                className={cn(
                  "relative overflow-hidden rounded-full",
                  compact
                    ? "h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
                    : "h-16 w-16 sm:h-20 sm:w-20 md:h-20 md:w-20 lg:h-24 lg:w-24 xl:h-28 xl:w-28",
                )}
              >
                <Image
                  src={store.logo_url}
                  alt={`${store.name} logo`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            </div>
          )}
        </div>

        <CardHeader
          className={cn(
            "flex-grow",
            compact
              ? "px-3 pb-3 pt-7 sm:pt-8 lg:pt-9"
              : "px-3 pb-4 pt-9 sm:pt-11 md:pt-11 lg:px-4 lg:pt-12 xl:px-5 xl:pt-14",
          )}
        >
          <div className="flex justify-between">
            <CardTitle
              className={cn(
                "w-full truncate font-bold",
                compact
                  ? "text-base sm:text-lg"
                  : "text-lg sm:text-xl md:text-2xl lg:text-[1.8rem] xl:text-[2rem]",
              )}
              title={store.name}
            >
              {store.name}
            </CardTitle>
            {status.isOpen && (
              <div
                className={cn(
                  "absolute right-2 flex items-center gap-1.5 rounded-full bg-green-500/90 px-2.5 py-1 backdrop-blur-sm",
                  compact ? "bottom-10" : "bottom-14",
                )}
              >
                <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-white" />
                <span className="text-[10px] font-semibold text-white">
                  {status.detail}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}