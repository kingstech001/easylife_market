import type { Metadata } from "next";
import Image from "next/image";
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

function getTodayKey(): DayKey {
  const days: DayKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[new Date().getDay()];
}

function isValidDaySchedule(schedule: any): boolean {
  return (
    schedule &&
    typeof schedule.openTime === "string" &&
    typeof schedule.closeTime === "string" &&
    schedule.openTime.includes(":")
  );
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

    const bh = store.businessHours as BusinessHours | undefined;
    const todayKey = getTodayKey();
    const resolvedBusinessHours: BusinessHours = isValidDaySchedule(
      bh?.[todayKey],
    )
      ? bh!
      : DEFAULT_BUSINESS_HOURS;

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
      businessHours: resolvedBusinessHours,
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
      storeId,
    });

    const products = await Product.find({
      isActive: true,
      storeId,
    })
      .select(
        "name price compareAtPrice inventoryQuantity hasVariants variants images",
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

    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,rgba(225,162,0,0.05),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.18))]">
        <VisitTracker storeId={store.id} />

        <section className="relative overflow-hidden">
          <div className="relative h-[220px] w-full sm:h-[280px] lg:h-[360px]">
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
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,8,0.2)_0%,rgba(8,8,8,0.42)_55%,rgba(8,8,8,0.75)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(225,162,0,0.16),transparent_34%)]" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(225,162,0,0.18),rgba(255,255,255,0.03)_35%,rgba(0,0,0,0.02)_100%)]" />
                <div className="absolute left-[-8%] top-[10%] h-40 w-40 rounded-full bg-[#e1a200]/20 blur-3xl sm:h-56 sm:w-56" />
                <div className="absolute bottom-[-10%] right-[-6%] h-44 w-44 rounded-full bg-primary/15 blur-3xl sm:h-64 sm:w-64" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <StoreIcon className="h-20 w-20 text-primary/25 sm:h-28 sm:w-28" />
                </div>
              </>
            )}
          </div>

          <div className="relative mx-auto -mt-14 max-w-7xl px-4 pb-6 sm:-mt-16 sm:px-6 lg:-mt-20 lg:px-8">
            <div className="overflow-hidden rounded-[28px] border border-border/70 bg-background/92 shadow-xl backdrop-blur-sm sm:rounded-[34px]">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4 sm:flex-row sm:items-start mb-4">
                    <div className="relative shrink-0">
                      {store.logo_url ? (
                        <div className="relative sm:w-20 md:w-auto">
                          <Image
                            src={store.logo_url}
                            alt={`${store.name} logo`}
                            width={112}
                            height={112}
                            className="h-20 w-20 rounded-[22px] border-4 border-background object-cover shadow-xl ring-1 ring-border/60 sm:h-24 sm:w-24 lg:h-28 lg:w-28"
                          />
                          <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#e1a200] text-white shadow-lg">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                        </div>
                      ) : (
                        <AvatarPlaceholder
                          name={store.name}
                          className="h-20 w-20 rounded-[22px] border-4 border-background text-2xl shadow-xl ring-1 ring-border/60 sm:h-24 sm:w-24 lg:h-28 lg:w-28 lg:text-3xl"
                        />
                      )}
                    </div>

                    <div className="min-w-0 space-y-3">
                      <div className="space-y-2">

                        <h1 className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                          {store.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2">
                          <StoreStatusBadge
                            openTime={openHour}
                            closeTime={closeHour}
                            isOpenToday={isOpenToday}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium text-foreground"
                  >
                    <Star className="mr-1.5 h-3.5 w-3.5 fill-current text-[#e1a200]" />
                    {reviewStats.reviewCount > 0
                      ? `${reviewStats.averageRating.toFixed(1)} rating`
                      : "New store"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium text-foreground"
                  >
                    {reviewStats.reviewCount} review
                    {reviewStats.reviewCount === 1 ? "" : "s"}
                  </Badge>
                  {store.categories.slice(0, 2).map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="rounded-full bg-muted px-3 py-1 text-[10px] font-medium text-foreground"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>

                {store.description && (
                  <div className="mt-5 rounded-[24px] border border-border/70 bg-muted/20 p-4 sm:mt-6 sm:p-5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8c6500]">
                      About this {isRestaurant ? "place" : "store"}
                    </p>
                    <ExpandableText text={store.description} limit={180} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-12 pt-2 sm:px-6 lg:px-8 lg:pb-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                  {sectionTitle}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {sectionCaption} Showing {storeProducts.length} of{" "}
                  {totalProducts} {isRestaurant ? "items" : "products"}.
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
                  />
                ))}
              </div>
            ) : (
              <Card className="rounded-[30px] border-2 border-dashed bg-background shadow-none">
                <CardContent className="px-6 py-14 text-center sm:px-8 sm:py-16">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#e1a200]/10">
                    {isRestaurant ? (
                      <Utensils className="h-10 w-10 text-[#e1a200]" />
                    ) : (
                      <Package className="h-10 w-10 text-[#e1a200]" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {emptyTitle}
                  </h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                    {emptyMessage}
                  </p>
                  <Button variant="outline" className="mt-6 rounded-full px-6">
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
