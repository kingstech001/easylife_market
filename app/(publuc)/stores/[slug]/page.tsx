// app/stores/[slug]/page.tsx

import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Package,
  ChevronRight,
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
import { ProductGrid } from "@/components/ProductGrid"; // New component

// ✅ Allow dynamic params
export const dynamicParams = true;

// ✅ Add revalidate to enable ISR
export const revalidate = 3600; // Revalidate every hour

// ✅ Limit initial products to prevent oversized pages
const INITIAL_PRODUCTS_LIMIT = 20; // Only load 20 products initially

// Types remain the same...
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
  variants?: Array<{
    color: { 
      name: string;
      hex: string;
      _id?: string;
    };
    sizes: Array<{ 
      size: string;
      quantity: number;
      _id?: string;
    }>;
    priceAdjustment?: number;
    _id?: string;
  }>;
}

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

// Generate static paths - same as before
export async function generateStaticParams() {
  if (process.env.NODE_ENV === "development") {
    console.log("⚠️ [Dev] Skipping generateStaticParams in development");
    return [];
  }

  try {
    console.log("🔍 [Build] Fetching stores directly from database");
    await connectToDB();
    const stores = await Store.find({ isPublished: true })
      .select("slug")
      .lean();
    console.log("🏪 [Build] Stores found:", stores.length);

    const params = stores.map((store: any) => ({ slug: store.slug }));
    console.log("✅ [Build] Generated params:", params.length);
    return params;
  } catch (error) {
    console.error("💥 [Build] Error generating static params:", error);
    return [];
  }
}

// Fetch store data - same as before
async function getStore(slug: string): Promise<StoreData | null> {
  try {
    console.log("🔍 Fetching store from database:", slug);
    await connectToDB();

    const store = (await Store.findOne({
      slug: slug,
      isPublished: true,
    }).lean()) as any;

    if (!store) {
      console.log("❌ Store not found:", slug);
      return null;
    }

    console.log("✅ Store fetched successfully:", store.name);

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
    };
  } catch (error) {
    console.error("❌ Error fetching store:", error);
    return null;
  }
}

// ✅ UPDATED: Fetch limited products with total count
async function getStoreProducts(
  storeId: string,
  storeSlug: string,
  limit: number = INITIAL_PRODUCTS_LIMIT
): Promise<{ products: ProductData[]; total: number }> {
  try {
    console.log("🔍 Fetching products from database for store:", storeId);
    await connectToDB();

    const store = (await Store.findOne({ slug: storeSlug }).lean()) as any;
    if (!store) {
      console.log("⚠️ Store not found for products lookup:", storeSlug);
      return { products: [], total: 0 };
    }

    // ✅ Get total count
    const totalCount = await Product.countDocuments({
      isActive: true,
      storeId: store._id,
    });

    console.log(`📊 Total products in store: ${totalCount}`);

    // ✅ Only fetch limited products with minimal fields
    let products: any[] = await Product.find({
      isActive: true,
      storeId: store._id,
    })
      .select('name price compareAtPrice images inventoryQuantity hasVariants variants createdAt updatedAt') // ✅ Only select needed fields
      .limit(limit) // ✅ Limit products
      .sort({ createdAt: -1 }) // ✅ Sort by newest first
      .lean();

    console.log(`✅ Fetched ${products.length} out of ${totalCount} products`);

    const transformedProducts = products.map((product: any) => {
      const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;

      return {
        id: product._id?.toString() || "",
        name: product.name || "Unnamed Product",
        description: product.description || null,
        price: product.price || 0,
        compare_at_price: product.compareAtPrice || null,
        category_id: product.categoryId?.toString() || undefined,
        inventory_quantity: product.inventoryQuantity || 0,
        images: (product.images || []).map((img: any) => ({
          id: img._id?.toString() || "",
          url: img.url || "",
          alt_text: img.altText || null,
        })),
        store_id: product.storeId?.toString() || "",
        created_at: product.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: product.updatedAt?.toISOString() || new Date().toISOString(),
        hasVariants: hasVariants,
        variants: hasVariants ? product.variants.map((variant: any) => ({
          color: {
            name: variant.color?.name || '',
            hex: variant.color?.hex || '#000000',
            _id: variant.color?._id?.toString()
          },
          sizes: (variant.sizes || []).map((size: any) => ({
            size: size.size || '',
            quantity: size.quantity || 0,
            _id: size._id?.toString()
          })),
          priceAdjustment: variant.priceAdjustment || 0,
          _id: variant._id?.toString()
        })) : undefined
      };
    });

    return {
      products: transformedProducts,
      total: totalCount
    };
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return { products: [], total: 0 };
  }
}

// Generate metadata - same as before
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

// ✅ UPDATED: Main page component
export default async function StorePage({ params }: StorePageProps) {
  try {
    const { slug } = await params;
    console.log("🎯 Rendering store page for slug:", slug);

    const store = await getStore(slug);

    if (!store) {
      console.log("❌ Store not found, showing 404");
      notFound();
    }

    // ✅ Get limited products and total count
    const { products: storeProducts, total: totalProducts } = await getStoreProducts(
      store.id, 
      slug, 
      INITIAL_PRODUCTS_LIMIT
    );

    console.log(`📦 Rendering ${storeProducts.length} of ${totalProducts} products`);

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
        <VisitTracker storeId={store.id} />

        {/* Store Banner - same as before */}
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

        {/* Store Header Section - same as before */}
        <div className="relative -mt-16 md:-mt-20">
          <div className="container mx-auto lg:px-8">
            <Card className="border-none md:border-2 shadow-xl">
              <CardContent className=" p-2 md:p-8">
                <div className="flex flex-col gap-6 md:gap-8">
                  <div className="flex md:flex-row items-start md:items-center gap-6">
                    <div className="relative flex-shrink-0 mx-0 md:mx-0">
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
                            <StoreStatusBadge openTime={7} closeTime={21} />
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
                      <div>
                        <ExpandableText text={store.description} limit={180} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Store Stats - ✅ Updated to show total products */}
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
                    Total Products
                  </div>
                </CardContent>
              </Card>

              {/* Other stats remain the same */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 flex-1 flex items-center justify-center py-2">
                <CardContent className="p-0 text-center">
                  <div className="flex items-center justify-center ">
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
                    Orders Completed
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

        {/* Products Section - ✅ Updated with pagination */}
        <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-screen-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Featured Products
                </h2>
                <p className="text-muted-foreground">
                  Showing {storeProducts.length} of {totalProducts} products
                </p>
              </div>
            </div>

            {storeProducts.length > 0 ? (
              <ProductGrid 
                initialProducts={storeProducts}
                totalProducts={totalProducts}
                storeId={store.id}
                storeSlug={store.slug}
              />
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Package className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    Store Opening Soon
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    {store.name} is preparing an amazing collection of products.
                    Check back soon to discover what's in store!
                  </p>
                  <Button variant="outline" className="rounded-xl">
                    Notify Me When Available
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