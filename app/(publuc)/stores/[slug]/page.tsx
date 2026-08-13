import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  ShieldCheck,
  Star,
  Store as StoreIcon,
  Utensils,
  Clock,
  ArrowLeft,
  ChevronRight,
  Heart,
} from "lucide-react";
import { VisitTracker } from "@/components/visit-tracker";
import ExpandableText from "@/components/ExpandableText";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Product from "@/models/Product";
import { StoreStatusBadge } from "@/components/store-status-badge";
import StoreReview from "@/models/StoreReview";
import {
  StoreReviewsSection,
  type StoreReviewItem,
} from "@/components/store-reviews-section";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRODUCTS_LIMIT = 12;

const FOOD_CATEGORIES = [
  "restaurant",
  "restaurants",
  "food",
  "cafe",
  "cafes",
  "eatery",
  "bakery",
  "bakeries",
  "fast food",
  "pizza",
  "grill",
  "bar",
  "canteen",
  "kitchen",
  "bistro",
  "diner",
];

const DEFAULT_BUSINESS_HOURS = {
  monday: { open: true, openTime: "09:00", closeTime: "20:00" },
  tuesday: { open: true, openTime: "09:00", closeTime: "20:00" },
  wednesday: { open: true, openTime: "09:00", closeTime: "20:00" },
  thursday: { open: true, openTime: "09:00", closeTime: "20:00" },
  friday: { open: true, openTime: "09:00", closeTime: "20:00" },
  saturday: { open: true, openTime: "09:00", closeTime: "20:00" },
  sunday: { open: false, openTime: "09:00", closeTime: "20:00" },
};

type DayKey = keyof typeof DEFAULT_BUSINESS_HOURS;

const DAY_KEYS: DayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DAY_LABELS: Record<DayKey, string> = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

function getTodayKey(date = new Date()): DayKey {
  return DAY_KEYS[date.getDay()];
}

function isValidDaySchedule(schedule: any): schedule is DaySchedule {
  return (
    schedule &&
    typeof schedule.open === "boolean" &&
    typeof schedule.openTime === "string" &&
    typeof schedule.closeTime === "string" &&
    schedule.openTime.includes(":")
  );
}

function formatDisplayTime(time: string): string {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function parseMinutes(time: string): number {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function resolveBusinessHours(
  businessHours?: Partial<BusinessHours> | null,
): BusinessHours {
  const resolved = {} as BusinessHours;

  for (const day of DAY_KEYS) {
    const schedule = businessHours?.[day];
    resolved[day] = isValidDaySchedule(schedule)
      ? schedule
      : DEFAULT_BUSINESS_HOURS[day]!;
  }

  return resolved;
}

function getStoreStatus(businessHours: BusinessHours): {
  isOpen: boolean;
  label: string;
  detail: string;
} {
  const now = new Date();
  const todayIndex = now.getDay();
  const todayKey = getTodayKey(now);
  const today = businessHours[todayKey];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (today.open) {
    const openMinutes = parseMinutes(today.openTime);
    const closeMinutes = parseMinutes(today.closeTime);
    const closesAfterMidnight = closeMinutes <= openMinutes;
    const isOpenNow = closesAfterMidnight
      ? currentMinutes >= openMinutes || currentMinutes < closeMinutes
      : currentMinutes >= openMinutes && currentMinutes < closeMinutes;

    if (isOpenNow) {
      return {
        isOpen: true,
        label: "Open",
        detail: `Closes ${formatDisplayTime(today.closeTime)}`,
      };
    }

    if (currentMinutes < openMinutes) {
      return {
        isOpen: false,
        label: "Closed",
        detail: `Opens ${formatDisplayTime(today.openTime)}`,
      };
    }
  }

  for (let i = 1; i <= 7; i++) {
    const nextIndex = (todayIndex + i) % 7;
    const nextKey = DAY_KEYS[nextIndex];
    const nextSchedule = businessHours[nextKey];

    if (nextSchedule.open) {
      const dayLabel = i === 1 ? "tomorrow" : DAY_LABELS[nextKey];
      return {
        isOpen: false,
        label: "Closed",
        detail: `Opens ${dayLabel} ${formatDisplayTime(nextSchedule.openTime)}`,
      };
    }
  }

  return {
    isOpen: false,
    label: "Closed",
    detail: "No opening hours",
  };
}

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
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  businessHours: BusinessHours;
  categories: string[];
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id?: string;
  inventory_quantity: number;
  images: { id: string; url: string; alt_text: string | null }[];
  store_id: string;
  created_at: string;
  updated_at: string;
  hasVariants?: boolean;
  hasModifiers?: boolean;
  variants?: any;
}

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

interface ReviewStats {
  averageRating: number;
  reviewCount: number;
}

async function getStore(slug: string): Promise<StoreData | null> {
  try {
    await connectToDB();

    const store = await Store.findOne({
      slug,
      isPublished: true,
    })
      .select(
        "name slug description logo_url banner_url sellerId createdAt updatedAt businessHours categories",
      )
      .lean();

    if (!store) {
      return null;
    }

    return {
      id: store._id?.toString() || "",
      name: store.name || "Unnamed Store",
      slug: store.slug || slug,
      description: store.description || "",
      logo_url: store.logo_url || "",
      banner_url: store.banner_url || "",
      owner_id: store.sellerId?.toString() || "",
      created_at: store.createdAt?.toISOString() || new Date().toISOString(),
      updated_at: store.updatedAt?.toISOString() || new Date().toISOString(),
      businessHours: resolveBusinessHours(
        store.businessHours as Partial<BusinessHours> | undefined,
      ),
      categories: (store.categories as string[]) || [],
    };
  } catch (error) {
    console.error("Error fetching store:", error);
    return null;
  }
}

async function getStoreProducts(
  storeId: string,
  limit: number = PRODUCTS_LIMIT,
): Promise<{ products: ProductData[]; total: number }> {
  try {
    await connectToDB();

    const totalCount = await Product.countDocuments({
      isActive: true,
      isDeleted: false,
      storeId,
      inventoryQuantity: { $gt: 0 },
    });

    const products = await Product.find({
      isActive: true,
      isDeleted: false,
      storeId,
      inventoryQuantity: { $gt: 0 },
    })
      .select(
        "name price compareAtPrice inventoryQuantity hasVariants variants hasModifiers images",
      )
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const transformedProducts = products.map((product: any) => {
      const hasVariants =
        product.variants &&
        Array.isArray(product.variants) &&
        product.variants.length > 0;

      return {
        id: product._id?.toString() || "",
        name: product.name || "Unnamed Product",
        description: null,
        price: product.price || 0,
        compare_at_price: product.compareAtPrice || null,
        inventory_quantity: product.inventoryQuantity || 0,
        images: (product.images || []).slice(0, 1).map((img: any) => ({
          id: img._id?.toString() || "",
          url: img.url || "",
          alt_text: img.altText || null,
        })),
        store_id: product.storeId?.toString() || "",
        created_at:
          product.createdAt?.toISOString() || new Date().toISOString(),
        updated_at:
          product.updatedAt?.toISOString() || new Date().toISOString(),
        hasVariants,
        hasModifiers: product.hasModifiers || false,
        variants: hasVariants
          ? JSON.parse(JSON.stringify(product.variants))
          : undefined,
      };
    });

    return { products: transformedProducts, total: totalCount };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [], total: 0 };
  }
}

async function getStoreReviews(
  storeId: string,
): Promise<{ reviews: StoreReviewItem[]; stats: ReviewStats }> {
  try {
    await connectToDB();

    const [reviews, stats] = await Promise.all([
      StoreReview.find({ storeId }).sort({ createdAt: -1 }).limit(10).lean(),
      StoreReview.aggregate([
        {
          $match: {
            storeId: StoreReview.db.base.Types.ObjectId.createFromHexString(storeId),
          },
        },
        {
          $group: {
            _id: "$storeId",
            averageRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const formattedReviews: StoreReviewItem[] = reviews.map((review: any) => ({
      id: review._id?.toString() || "",
      userId: review.userId?.toString() || "",
      reviewerName: review.reviewerName || "Anonymous",
      rating: review.rating || 0,
      comment: review.comment || "",
      createdAt: review.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: review.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    const summary = stats[0];

    return {
      reviews: formattedReviews,
      stats: {
        averageRating:
          typeof summary?.averageRating === "number"
            ? Number(summary.averageRating.toFixed(1))
            : 0,
        reviewCount: summary?.reviewCount || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching store reviews:", error);
    return {
      reviews: [],
      stats: {
        averageRating: 0,
        reviewCount: 0,
      },
    };
  }
}

export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const store = await getStore(slug);

    if (!store) {
      return {
        title: "Store Not Found | EasyLife Market",
        description: "The store you're looking for could not be found.",
      };
    }

    return {
      title: `${store.name} | EasyLife Market`,
      description:
        store.description || `Shop at ${store.name} on EasyLife Market`,
      openGraph: {
        title: store.name,
        description: store.description || `Shop at ${store.name}`,
        images: store.banner_url ? [store.banner_url] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Store | EasyLife Market",
      description: "Shop on EasyLife Market",
    };
  }
}

export default async function StorePage({ params }: StorePageProps) {
  try {
    const { slug } = await params;
    const store = await getStore(slug);

    if (!store) {
      notFound();
    }

    const { products: storeProducts, total: totalProducts } =
      await getStoreProducts(store.id, PRODUCTS_LIMIT);
    const { reviews: storeReviews, stats: reviewStats } =
      await getStoreReviews(store.id);

    const todayKey = getTodayKey();
    const rawSchedule = store.businessHours?.[todayKey];
    const todaySchedule = isValidDaySchedule(rawSchedule)
      ? rawSchedule
      : DEFAULT_BUSINESS_HOURS[todayKey];

    const openHour = todaySchedule.openTime;
    const closeHour = todaySchedule.closeTime;
    const isOpenToday = todaySchedule.open;
    const storeStatus = getStoreStatus(store.businessHours);

    const isRestaurant = store.categories.some((cat) =>
      FOOD_CATEGORIES.includes(cat.toLowerCase().trim()),
    );

    const sectionTitle = isRestaurant ? "Our Menu" : "Featured Products";
    const sectionCaption = isRestaurant
      ? "Fresh picks from today's menu and customer favorites."
      : "A curated selection of products available from this store right now.";
    const statOneLabel = isRestaurant ? "Menu Items" : "Total Products";
    const statThreeLabel = isRestaurant ? "Orders Served" : "Orders Completed";
    const emptyTitle = isRestaurant ? "Menu Coming Soon" : "Store Opening Soon";
    const emptyMessage = isRestaurant
      ? `${store.name} is preparing their menu. Check back soon to see what's cooking.`
      : `${store.name} is preparing an amazing collection of products. Check back soon to discover what's in store.`;
    const emptyButtonText = isRestaurant
      ? "Notify Me When Menu Is Live"
      : "Notify Me When Available";
    const primaryCategory = store.categories[0] || (isRestaurant ? "Restaurants" : "Stores");
    const mobileStoreSummary =
      store.description?.trim() || `Shop from ${store.name} on EasyLife.`;

    return (
      <div className="min-h-screen bg-background">
        <VisitTracker storeId={store.id} />

        <section className="relative border-b border-border/60 bg-background">
          <div className="mx-auto max-w-5xl px-4 pb-6 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
            <Link
              href="/stores"
              aria-label="Back to stores"
              className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-[#0E5A43] shadow-sm lg:h-10 lg:w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="mb-4 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground lg:text-xs">
              {/* <span>Home</span>
              <ChevronRight className="h-3 w-3" /> */}
              <span className="text-foreground">{primaryCategory}</span>
            </div>

            <div className="relative mx-auto aspect-[1.95/1] w-full max-w-md overflow-hidden rounded-lg bg-muted shadow-sm sm:max-w-2xl lg:aspect-[2.7/1] lg:max-w-4xl lg:rounded-xl">
              {store.banner_url ? (
                <Image
                  src={store.banner_url}
                  alt={`${store.name} banner`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#083B2D]">
                  <StoreIcon className="h-16 w-16 text-white/25" />
                </div>
              )}

              <div className="absolute bottom-3 left-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border-2 border-white bg-card shadow-sm lg:bottom-5 lg:left-5 lg:h-20 lg:w-20 lg:rounded-lg">
                {store.logo_url ? (
                  <Image
                    src={store.logo_url}
                    alt={`${store.name} logo`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <AvatarPlaceholder
                    name={store.name}
                    className="h-full w-full rounded-none text-base"
                  />
                )}
              </div>

              {/* <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#1F2937] shadow-sm">
                <Clock className="h-3.5 w-3.5" />
                {storeStatus.isOpen ? "Open now" : "Closed now"}
              </div> */}

              <button
                type="button"
                aria-label="Save store"
                className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0E5A43] shadow-sm lg:bottom-5 lg:right-5 lg:h-12 lg:w-12"
              >
                <Heart className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-auto mt-4 max-w-2xl text-center lg:mt-6">
              <h1 className="mx-auto max-w-xl text-2xl font-semibold leading-tight text-[#111827] sm:text-3xl lg:text-5xl">
                {store.name}
              </h1>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0E5A43] lg:mt-4 lg:text-sm">
                <ShieldCheck className="h-4 w-4 fill-[#0E5A43]/10 lg:h-5 lg:w-5" />
                <span>Verified</span>
              </div>

              <p className="mx-auto mt-3 max-w-xs truncate text-xs text-muted-foreground sm:max-w-md lg:max-w-xl lg:text-sm">
                {mobileStoreSummary}
              </p>

              <div className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-[#1F2937] lg:text-sm">
                <Star className="h-4 w-4 fill-[#F4C430] text-[#F4C430] lg:h-5 lg:w-5" />
                {reviewStats.reviewCount > 0 ? (
                  <>
                    <span>{reviewStats.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({reviewStats.reviewCount})
                    </span>
                  </>
                ) : (
                  <span>New store</span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground lg:h-4 lg:w-4" />
              </div>

              <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] lg:text-xs">
                <span className={storeStatus.isOpen ? "text-[#0E5A43]" : "text-red-600"}>
                  {storeStatus.label}
                </span>
                <span className="mx-1.5 text-muted-foreground">.</span>
                <span className="text-[#1F2937]">
                  {storeStatus.detail}
                </span>
              </div>
            </div>
          </div>

          <div className="relative hidden w-full lg:h-[320px]">
            {store.banner_url ? (
              <>
                <Image
                  src={store.banner_url}
                  alt={`${store.name} banner`}
                  fill
                  className="object-cover"
                  priority
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/35" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[#083B2D]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <StoreIcon className="h-28 w-28 text-white/20" />
                </div>
              </>
            )}
          </div>

          <div className="relative mx-auto hidden max-w-7xl px-4 py-4 sm:px-6 lg:-mt-16 lg:px-8 lg:pb-8 lg:pt-0">
            <div className="overflow-hidden rounded border border-border bg-card shadow-sm lg:shadow-xl">
              <div className="p-4 sm:p-6 lg:p-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="relative shrink-0">
                      {store.logo_url ? (
                        <Image
                          src={store.logo_url}
                          alt={`${store.name} logo`}
                          width={104}
                          height={104}
                          className="h-20 w-20 rounded-3xl border border-border bg-muted object-cover shadow-sm sm:h-24 sm:w-24"
                        />
                      ) : (
                        <AvatarPlaceholder
                          name={store.name}
                          className="h-20 w-20 rounded border border-border text-2xl shadow-sm sm:h-24 sm:w-24"
                        />
                      )}
                      <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded bg-[#0E5A43] text-white shadow-sm">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StoreStatusBadge
                          openTime={openHour}
                          closeTime={closeHour}
                          isOpenToday={isOpenToday}
                        />
                        <Badge
                          variant="secondary"
                          className="rounded border border-[#F4C430]/40 bg-[#F4C430]/15 px-2.5 py-1 text-[11px] font-medium text-[#083B2D]"
                        >
                          <Star className="mr-1 h-3.5 w-3.5 fill-[#F4C430] text-[#F4C430]" />
                          {reviewStats.reviewCount > 0
                            ? `${reviewStats.averageRating.toFixed(1)} rating`
                            : "New store"}
                        </Badge>
                      </div>

                      <h1 className="max-w-3xl text-2xl font-semibold leading-tight text-foreground sm:text-4xl">
                        {store.name}
                      </h1>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Package className="h-4 w-4 text-[#0E5A43]" />
                          {totalProducts} {statOneLabel.toLowerCase()}
                        </span>
                        <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" />
                        <span className="inline-flex items-center gap-1.5">
                          <Star className="h-4 w-4 text-[#F4C430]" />
                          {reviewStats.reviewCount} review
                          {reviewStats.reviewCount === 1 ? "" : "s"}
                        </span>
                        <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline-block" />
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-[#0E5A43]" />
                          {isOpenToday
                            ? `${openHour} - ${closeHour}`
                            : "Closed today"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {store.categories.length > 0 && (
                    <div className="flex max-w-full flex-wrap gap-2 md:max-w-xs md:justify-end">
                      {store.categories.slice(0, 4).map((category) => (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="rounded bg-muted px-3 py-1 text-[11px] font-medium text-foreground"
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {store.description && (
                  <div className="mt-5 border-t border-border/70 pt-5">
                    <p className="mb-2 text-[11px] font-semibold uppercase text-[#083B2D]">
                      About this {isRestaurant ? "place" : "store"}
                    </p>
                    <div className="max-w-4xl text-sm leading-6 text-muted-foreground">
                      <ExpandableText text={store.description} limit={150} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pb-16 lg:pt-4">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                  {sectionTitle}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sectionCaption}
                </p>
              </div>
            </div>

            {storeProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {storeProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeSlug={store.slug}
                    isRestaurant={isRestaurant}
                  />
                ))}
              </div>
            ) : (
              <Card className="rounded border-2 border-dashed bg-card shadow-none">
                <CardContent className="px-6 py-14 text-center sm:px-8 sm:py-16">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded bg-[#0E5A43]/10">
                    {isRestaurant ? (
                      <Utensils className="h-10 w-10 text-[#0E5A43]" />
                    ) : (
                      <Package className="h-10 w-10 text-[#0E5A43]" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {emptyTitle}
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                    {emptyMessage}
                  </p>
                  <Button variant="outline" className="mt-6 rounded px-6">
                    {emptyButtonText}
                  </Button>
                </CardContent>
              </Card>
            )}

            <StoreReviewsSection
              storeSlug={store.slug}
              initialReviews={storeReviews}
              initialStats={reviewStats}
            />
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error("Critical error in StorePage:", error);
    notFound();
  }
}
