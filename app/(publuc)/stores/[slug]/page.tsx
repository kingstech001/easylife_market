// app/stores/[slug]/page.tsx

import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  Package,
  Utensils,
  Store as StoreIcon,
  TrendingUp,
  Award,
  ShieldCheck,
} from "lucide-react";
import { VisitTracker } from "@/components/visit-tracker";
import ExpandableText from "@/components/ExpandableText";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Product from "@/models/Product";
import { StoreStatusBadge } from "@/components/store-status-badge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRODUCTS_LIMIT = 12;

// ─── Restaurant / food category keywords ─────────────────────────────────────
const FOOD_CATEGORIES = [
  "restaurant", "restaurants", "food", "cafe", "cafes", "eatery",
  "bakery", "bakeries", "fast food", "pizza", "grill", "bar",
  "canteen", "kitchen", "bistro", "diner",
];

// ─── Fallback business hours ──────────────────────────────────────────────────
const DEFAULT_BUSINESS_HOURS = {
  monday:    { open: true,  openTime: "09:00", closeTime: "20:00" },
  tuesday:   { open: true,  openTime: "09:00", closeTime: "20:00" },
  wednesday: { open: true,  openTime: "09:00", closeTime: "20:00" },
  thursday:  { open: true,  openTime: "09:00", closeTime: "20:00" },
  friday:    { open: true,  openTime: "09:00", closeTime: "20:00" },
  saturday:  { open: true,  openTime: "09:00", closeTime: "20:00" },
  sunday:    { open: false, openTime: "09:00", closeTime: "20:00" },
};

type DayKey = keyof typeof DEFAULT_BUSINESS_HOURS;

function getTodayKey(): DayKey {
  const days: DayKey[] = [
    "sunday", "monday", "tuesday", "wednesday",
    "thursday", "friday", "saturday",
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
  monday:    DaySchedule;
  tuesday:   DaySchedule;
  wednesday: DaySchedule;
  thursday:  DaySchedule;
  friday:    DaySchedule;
  saturday:  DaySchedule;
  sunday:    DaySchedule;
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

async function getStore(slug: string): Promise<StoreData | null> {
  try {
    await connectToDB();

    const store = await Store.findOne({
      slug: slug,
      isPublished: true,
    })
      .select(
        "name slug description logo_url banner_url sellerId createdAt updatedAt businessHours categories",
      )
      .lean();

    if (!store) return null;

    const bh = store.businessHours as BusinessHours | undefined;
    const todayKey = getTodayKey();
    const resolvedBusinessHours: BusinessHours = isValidDaySchedule(bh?.[todayKey])
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
    console.error("❌ Error fetching store:", error);
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
      storeId: storeId,
    });

    const products = await Product.find({
      isActive: true,
      storeId: storeId,
    })
      .select("name price compareAtPrice inventoryQuantity hasVariants variants images")
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
        created_at: product.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: product.updatedAt?.toISOString() || new Date().toISOString(),
        hasVariants: hasVariants,
        variants: hasVariants
          ? JSON.parse(JSON.stringify(product.variants))
          : undefined,
      };
    });

    return { products: transformedProducts, total: totalCount };
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return { products: [], total: 0 };
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
    console.error("❌ Error generating metadata:", error);
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

    if (!store) notFound();

    const { products: storeProducts, total: totalProducts } =
      await getStoreProducts(store.id, PRODUCTS_LIMIT);

    // ✅ Resolve today's schedule
    const todayKey = getTodayKey();
    const rawSchedule = store.businessHours?.[todayKey];
    const todaySchedule = isValidDaySchedule(rawSchedule)
      ? rawSchedule
      : DEFAULT_BUSINESS_HOURS[todayKey];

    const openHour    = todaySchedule.openTime;  // "09:00"
    const closeHour   = todaySchedule.closeTime; // "18:00"
    const isOpenToday = todaySchedule.open;

    // ✅ Detect restaurant/food store
    const isRestaurant = store.categories.some((cat) =>
      FOOD_CATEGORIES.includes(cat.toLowerCase().trim())
    );

    // ✅ Dynamic section copy based on store type
    const sectionTitle    = isRestaurant ? "Our Menu"         : "Featured Products";
    const emptyTitle      = isRestaurant ? "Menu Coming Soon" : "Store Opening Soon";
    const emptyMessage    = isRestaurant
      ? `${store.name} is preparing their menu. Check back soon to see what's cooking!`
      : `${store.name} is preparing an amazing collection of products. Check back soon to discover what's in store!`;
    const emptyButtonText = isRestaurant
      ? "Notify Me When Menu is Live"
      : "Notify Me When Available";

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
        <VisitTracker storeId={store.id} />

        {/* Store Banner */}
        <div className="relative h-56 md:h-72 lg:h-80 w-full overflow-hidden">
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
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-background" />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 via-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary rounded-full blur-3xl" />
              </div>
              <StoreIcon className="h-24 w-24 md:h-32 md:w-32 text-primary/30" />
            </div>
          )}
        </div>

        {/* Store Header */}
        <div className="relative -mt-16 md:-mt-20">
          <div className="container mx-auto lg:px-8">
            <Card className="border-none md:border-2 shadow-xl">
              <CardContent className="p-2 md:p-8">
                <div className="flex flex-col gap-6 md:gap-8">
                  <div className="flex md:flex-row items-start md:items-center gap-6">
                    <div className="relative flex-shrink-0">
                      {store.logo_url ? (
                        <div className="relative">
                          <Image
                            src={store.logo_url}
                            alt={`${store.name} logo`}
                            width={96}
                            height={96}
                            className="w-16 h-16 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-background shadow-2xl ring-2 ring-primary/10"
                          />
                          <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
                            <ShieldCheck className="h-3 w-3 md:h-4 md:w-4" />
                          </div>
                        </div>
                      ) : (
                        <AvatarPlaceholder
                          name={store.name}
                          className="h-24 w-24 md:h-32 md:w-32 text-2xl md:text-3xl border-4 border-background rounded-2xl shadow-2xl ring-2 ring-primary/10"
                        />
                      )}
                    </div>
                    <div className="space-y-3 w-full">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                            {store.name}
                          </h1>
                          <div className="flex items-center gap-2 flex-wrap">
                            <StoreStatusBadge
                              openTime={openHour}
                              closeTime={closeHour}
                              isOpenToday={isOpenToday}
                            />
                            <Badge
                              variant="default"
                              className="flex items-center gap-1.5 px-3 py-1"
                            >
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span className="font-semibold">4.8</span>
                              <span className="text-xs opacity-80">
                                (127 reviews)
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {store.description && (
                      <ExpandableText text={store.description} limit={180} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Store Stats */}
            <div className="flex gap-1 sm:gap-4 justify-between px-2">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 flex-1 flex items-center justify-center py-2">
                <CardContent className="p-0 items-center justify-center text-center">
                  <div className="flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-[10px] sm:text-xl font-bold text-blue-900 dark:text-blue-100">
                    {totalProducts}
                  </div>
                  <div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                    {/* ✅ Dynamic stat label */}
                    {isRestaurant ? "Menu Items" : "Total Products"}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 flex-1 flex items-center justify-center py-2">
                <CardContent className="p-0 text-center">
                  <div className="flex items-center justify-center">
                    <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-[10px] sm:text-xl font-bold text-green-900 dark:text-green-100">
                    4.8
                  </div>
                  <div className="text-[10px] text-green-700 dark:text-green-300 font-medium">
                    Store Rating
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 flex-1 flex items-center justify-center py-2">
                <CardContent className="p-0 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-[10px] sm:text-xl font-bold text-purple-900 dark:text-purple-100">
                    127
                  </div>
                  <div className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                    {/* ✅ Dynamic stat label */}
                    {isRestaurant ? "Orders Served" : "Orders Completed"}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 flex-1 flex items-center justify-center py-2">
                <CardContent className="p-0 text-center">
                  <div className="flex items-center justify-center">
                    <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-[10px] sm:text-xl font-bold text-orange-900 dark:text-orange-100">
                    98%
                  </div>
                  <div className="text-[10px] text-orange-700 dark:text-orange-300 font-medium">
                    Positive Reviews
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Products / Menu Section */}
        <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-screen-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                {/* ✅ Dynamic section title */}
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {sectionTitle}
                </h2>
                <p className="text-muted-foreground">
                  Showing {storeProducts.length} of {totalProducts}{" "}
                  {isRestaurant ? "items" : "products"}
                </p>
              </div>
            </div>

            {storeProducts.length > 0 ? (
              <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {storeProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    storeSlug={store.slug}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    {/* ✅ Dynamic empty state icon */}
                    {isRestaurant ? (
                      <Utensils className="h-10 w-10 text-primary" />
                    ) : (
                      <Package className="h-10 w-10 text-primary" />
                    )}
                  </div>
                  {/* ✅ Dynamic empty state copy */}
                  <h3 className="text-xl font-semibold mb-3">{emptyTitle}</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    {emptyMessage}
                  </p>
                  <Button variant="outline" className="rounded-xl">
                    {emptyButtonText}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ Critical error in StorePage:", error);
    notFound();
  }
}