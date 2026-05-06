"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StoreCard } from "@/components/store-card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Megaphone,
  Search,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

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
  createdAt: string;
  updatedAt: string;
  productCount?: number;
  businessHours?: BusinessHours;
}

interface HeroBanner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
}

interface StoresPageClientProps {
  initialStores: StoreData[];
}

const HERO_ROTATION_MS = 60000;
const HERO_SWAP_DELAY_MS = 100;

export default function StoresPageClient({
  initialStores,
}: StoresPageClientProps) {
  const router = useRouter();
  const stores = initialStores;
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const featuredStores = useMemo(() => stores.slice(0, 4), [stores]);

  const fetchNewBanner = async () => {
    try {
      setIsTransitioning(true);
      const bannerRes = await fetch("/api/hero-banner", {
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });

      if (bannerRes.ok) {
        const bannerData = await bannerRes.json();
        if (bannerData.banner) {
          setTimeout(() => {
            setHeroBanner(bannerData.banner);
            setIsTransitioning(false);
          }, HERO_SWAP_DELAY_MS);
        }
      } else {
        setIsTransitioning(false);
      }
    } catch {
      setIsTransitioning(false);
    }
  };

  useEffect(() => {
    fetchNewBanner();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchNewBanner, HERO_ROTATION_MS);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      router.push(`/Search?search=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(225,162,0,0.06),transparent_28%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.18))]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hidden lg:block">
          {heroBanner?.imageUrl ? (
            <>
              <div
                className={cn(
                  "absolute inset-0 transition-opacity duration-500",
                  isTransitioning ? "opacity-0" : "opacity-100",
                )}
              >
                <Image
                  key={heroBanner.id}
                  src={heroBanner.imageUrl}
                  alt={heroBanner.title || "Stores hero banner"}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.8)_0%,rgba(8,8,8,0.58)_46%,rgba(8,8,8,0.8)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(225,162,0,0.22),transparent_34%)]" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(225,162,0,0.18),rgba(255,255,255,0.02)_35%,rgba(0,0,0,0.02)_100%)]" />
              <div className="absolute left-[-10%] top-[-8%] h-48 w-48 rounded-full bg-[#e1a200]/20 blur-3xl sm:h-64 sm:w-64" />
              <div className="absolute bottom-[-12%] right-[-8%] h-56 w-56 rounded-full bg-foreground/10 blur-3xl sm:h-72 sm:w-72" />
            </>
          )}
        </div>

        <div className="relative mx-auto max-w-7xl pt-3 sm:px-6 sm:pb-10 lg:px-8 lg:pb-14 lg:pt-8">
          <div className="mx-auto max-w-4xl">
            <div className="hidden lg:block">
              <Badge className="inline-flex border border-white/15 bg-white/10  py-2 text-sm font-semibold text-white backdrop-blur-sm">
                <Sparkles className="mr-2 h-4 w-4 text-[#f6cf66]" />
                Discover trusted stores
              </Badge>

              <div className="mt-5 space-y-4 sm:mt-7 sm:space-y-5">
                <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-6xl">
                  {heroBanner?.title ||
                    "Explore standout stores across the marketplace"}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7 lg:text-lg">
                  {heroBanner?.subtitle ||
                    "Browse growing brands, neighborhood businesses, food vendors, and premium sellers in one polished shopping destination."}
                </p>
              </div>
            </div>

            <div className="mx-4 rounded-[28px] border border-white/15 bg-white/10 shadow-2xl shadow-black/20 backdrop-blur-md sm:mt-8 sm:p-4">
              <form
                onSubmit={handleSearch}
                className="flex flex-col gap-3 sm:flex-row sm:items-center relative"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for stores, products, or categories..."
                    className={cn(
                      "h-12 rounded-full border-0 bg-white/12 pl-11 pr-4 text-sm text-white shadow-none placeholder:text-foreground/70 focus:ring-0  focus-visible:ring-2 focus-visible:ring-[#f0c14b]/80 focus-visible:ring-offset-0 transition-colors duration-300",
                      "focus-visible:ring-2 focus-visible:ring-[#f0c14b] focus-visible:ring-offset-0",
                      "sm:h-14 sm:text-[15px]",
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className=" flex items-center rounded-full px-3 py-0 bg-[#e1a200] text-sm font-semibold text-white hover:bg-[#c89100] absolute right-1 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0"
                >
                  <ArrowRight className=" h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 ">
          <div className="rounded-[28px] border border-[#e1a200]/15 bg-[linear-gradient(135deg,rgba(225,162,0,0.12),rgba(225,162,0,0.03)_45%,rgba(255,255,255,0.78)_100%)] p-5 shadow-sm sm:p-6">
            <div >
              <div className="flex flex-col md:flex-row justify-between md:items-center">
                <h2 className=" text-sm md:text-xl font-semibold text-foreground sm:text-2xl">
                  Advertise your business to active shoppers
                </h2>
                <div className="mt-2 md:mt-0">
                  <Link
                    href="https://wa.me/2348071427831"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="h-8 rounded-full bg-[#e1a200] px-5 text-white hover:bg-[#c89100]">
                      Contact us on WhatsApp
                      <FaWhatsapp className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-14"
        id="stores"
      >
        {stores.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-border bg-background p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#e1a200]/10">
              <Store className="h-10 w-10 text-[#e1a200]" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-foreground">
              No stores available yet
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Be the first to launch a store on the platform and start reaching
              customers across the marketplace.
            </p>
            <div className="mt-6">
              <Link href="/auth/register">
                <Button className="h-11 rounded-full bg-[#e1a200] px-6 text-white hover:bg-[#c89100]">
                  Launch your store
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-[30px] border border-border/70 bg-background/85 p-5 shadow-sm backdrop-blur sm:p-6">
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stores.map((store, index) => (
                  <div
                    key={store._id}
                    className="group relative transition-all duration-300 hover:-translate-y-1"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="absolute -inset-0.5 rounded-[22px] bg-gradient-to-r from-[#e1a200]/18 via-transparent to-[#d4b55e]/16 opacity-0 blur transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative overflow-hidden rounded-[22px] border border-border/70 bg-card transition-all duration-300 group-hover:border-[#e1a200]/40 group-hover:shadow-xl group-hover:shadow-[#e1a200]/10">
                      <StoreCard store={store} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 rounded-[28px] border border-border/70 bg-background/85 p-5 shadow-sm backdrop-blur sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6500]">
                Become a seller
              </p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">
                Open your store on EasyLife
              </h3>

              <div className="mt-4">
                <Link href="/auth/register">
                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-border bg-background px-5 hover:border-[#e1a200]/45 hover:bg-[#e1a200]/[0.05]"
                  >
                    Join now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
