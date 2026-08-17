"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoreStatus, type BusinessHours } from "@/lib/store-hours";

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
}

export function StoreCard({ store }: StoreCardProps) {
  const status = getStoreStatus(store.businessHours);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (status.isOpen) return;
    event.preventDefault();
    toast.info(`${store.name} is currently closed`, {
      description:
        status.detail === "No opening hours"
          ? "Please check back later."
          : `${status.detail}. Please check back then.`,
    });
  };

  return (
    <Link
      href={`/stores/${store.slug}`}
      onClick={handleClick}
      aria-disabled={!status.isOpen}
      className="block h-full w-full"
    >
      <Card className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
        <div className="relative h-28 w-full flex-shrink-0 overflow-hidden bg-muted">
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
                <span className="text-xs font-semibold text-white">{status.detail}</span>
              </div>
            </div>
          )}

          {!store.isPublished && (
            <Badge className="absolute right-2 top-2 bg-red-500 text-white">Draft</Badge>
          )}
        </div>

        {store.logo_url && (
          <div className="absolute left-4 top-20 z-20 h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-4 border-card bg-card shadow-md">
            <Image
              src={store.logo_url}
              alt={`${store.name} logo`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}

        <CardHeader className="flex-grow px-3 pb-4 pt-10">
          <div className="flex justify-between">
            <CardTitle className="w-full truncate text-lg font-bold sm:text-xl" title={store.name}>
              {store.name}
            </CardTitle>
            {status.isOpen && (
              <div className="absolute bottom-14 right-2 flex items-center gap-1.5 rounded-full bg-green-500/90 px-2.5 py-1 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-white" />
                <span className="text-[10px] font-semibold text-white">{status.detail}</span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
