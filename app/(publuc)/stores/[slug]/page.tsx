// app/stores/[slug]/page.tsx
import type { Metadata } from "next";
import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { ArrowLeft, Package, ShieldCheck, Star, Store as StoreIcon, Utensils } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder";
import { VisitTracker } from "@/components/visit-tracker";
import ExpandableText from "@/components/ExpandableText";
import { LiveStoreStatus } from "@/components/live-store-status";
import { connectToDB } from "@/lib/db";
import Store from "@/models/Store";
import Product from "@/models/Product";
import StoreReview from "@/models/StoreReview";
import {
  StoreReviewsSection,
  type StoreReviewItem,
} from "@/components/store-reviews-section";
import {
  resolveBusinessHours,
  type BusinessHours,
} from "@/lib/store-hours";

// Cached at the CDN and refreshed in the background every minute.
// (It used to be force-dynamic: every single visit ran 5+ database queries.)
// Open/closed is computed in the browser by <LiveStoreStatus />, so caching
// the page can't show a stale "Open".
export const revalidate = 60;

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

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  businessHours: BusinessHours;
  categories: string[];
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  inventory_quantity: number;
  images: { id: string; url: string; alt_text: string | null }[];
  store_id: string;
  created_at: string;
  updated_at: string;
  hasVariants: boolean;
  hasModifiers: boolean;
}

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

interface ReviewStats {
  averageRating: number;
  reviewCount: number;
}

// React cache() = generateMetadata and the page share ONE query per request
const getStore = cache(async (slug: string): Promise<StoreData | null> => {
  try {
    await connectToDB();

    const store = await Store.findOne({ slug, isPublished: true })
      .select(
        "name slug description logo_url banner_url businessHours categories",
      )
      .lean();

    if (!store) return null;

    return {
      id: store._id?.toString() || "",
      name: store.name || "Unnamed Store",
      slug: store.slug || slug,
      description: store.description || "",
      logo_url: store.logo_url || "",
      banner_url: store.banner_url || "",
      businessHours: resolveBusinessHours(
        store.businessHours as Partial<BusinessHours> | undefined,
      ),
      categories: (store.categories as string[]) || [],
    };
  } catch (error) {
    console.error("Error fetching store:", error);
    return null;
  }
});

async function getStoreProducts(storeId: string): Promise<ProductData[]> {
  try {
    await connectToDB();

    // No countDocuments (the total was only shown in dead, hidden markup) and no
    // `variants` payload (the card only needs the hasVariants / hasModifiers flags).
    const products = await Product.find({
      isActive: true,
      isDeleted: false,
      storeId,
      inventoryQuantity: { $gt: 0 },
    })
      .select(
        "name price compareAtPrice inventoryQuantity hasVariants hasModifiers images storeId createdAt updatedAt",
      )
      .sort({ createdAt: -1 })
      .limit(PRODUCTS_LIMIT)
      .lean();

    return products.map((product: any) => ({
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
      hasVariants: !!product.hasVariants,
      hasModifiers: !!product.hasModifiers,
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
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
    return { reviews: [], stats: { averageRating: 0, reviewCount: 0 } };
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

    // Products and reviews don't depend on each other: fetch them together
    const [storeProducts, { reviews: storeReviews, stats: reviewStats }] =
      await Promise.all([getStoreProducts(store.id), getStoreReviews(store.id)]);

    const isRestaurant = store.categories.some((cat) =>
      FOOD_CATEGORIES.includes(cat.toLowerCase().trim()),
    );

    const sectionTitle = isRestaurant ? "Our menu" : "Featured products";
    const sectionCaption = isRestaurant
      ? "Fresh picks from today's menu and customer favourites."
      : "A selection of products available from this store right now.";
    const emptyTitle = isRestaurant ? "Menu coming soon" : "Products coming soon";
    const emptyMessage = isRestaurant
      ? `${store.name} is preparing their menu. Check back soon.`
      : `${store.name} is still setting up their shop. Check back soon.`;

    return (
      <div className="min-h-screen bg-background">
        <VisitTracker storeId={store.id} />

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
            <Link
              href="/stores"
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              All stores
            </Link>

            <div className="relative">
              <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl bg-muted sm:aspect-[2.4/1] lg:aspect-[3/1]">
                {store.banner_url ? (
                  <Image
                    src={store.banner_url}
                    alt={`${store.name} banner`}
                    fill
                    priority
                    className="object-cover"
                    sizes="(min-width: 1024px) 1100px, 100vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#083B2D]">
                    <StoreIcon className="h-14 w-14 text-white/25" />
                  </div>
                )}
              </div>

              {/* Logo overlaps the banner's bottom edge */}
              <div className="absolute -bottom-8 left-4 h-16 w-16 overflow-hidden rounded-2xl border-4 border-background bg-card shadow-sm sm:-bottom-10 sm:left-6 sm:h-20 sm:w-20 lg:h-24 lg:w-24">
                {store.logo_url ? (
                  <Image
                    src={store.logo_url}
                    alt={`${store.name} logo`}
                    fill
                    priority
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <AvatarPlaceholder
                    name={store.name}
                    className="h-full w-full rounded-none text-lg"
                  />
                )}
              </div>
            </div>

            <div className="space-y-3 pb-6 pt-11 sm:pt-14 lg:pt-16">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {store.name}
                </h1>
                <ShieldCheck
                  className="h-5 w-5 shrink-0 text-[#0E5A43] dark:text-emerald-400"
                  aria-label="Verified store"
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <a
                  href="#reviews"
                  className="inline-flex items-center gap-1.5 text-sm text-foreground hover:underline"
                >
                  <Star className="h-4 w-4 fill-[#F4C430] text-[#F4C430]" />
                  {reviewStats.reviewCount > 0 ? (
                    <>
                      <span className="font-medium">
                        {reviewStats.averageRating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({reviewStats.reviewCount})
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">New store</span>
                  )}
                </a>

                <LiveStoreStatus businessHours={store.businessHours} />

                {store.categories.slice(0, 3).map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/80"
                  >
                    {category}
                  </span>
                ))}
              </div>

              {store.description && (
                <div className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  <ExpandableText text={store.description} limit={160} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Products ────────────────────────────────────────────────────── */}
        <section className="px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pb-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {sectionTitle}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {sectionCaption}
              </p>
            </div>

            {storeProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4">
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
              <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  {isRestaurant ? (
                    <Utensils className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {emptyTitle}
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {emptyMessage}
                </p>
              </div>
            )}

            <div id="reviews" className="mt-14 scroll-mt-24">
              <StoreReviewsSection
                storeSlug={store.slug}
                initialReviews={storeReviews}
                initialStats={reviewStats}
              />
            </div>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    unstable_rethrow(error);
    console.error("Critical error in StorePage:", error);
    notFound();
  }
}