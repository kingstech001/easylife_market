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
  MapPin,
  Clock,
  Star,
  Package,
  MessageCircle,
  Share2,
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

// ✅ Allow dynamic params
export const dynamicParams = true;

// ✅ Types
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
}

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

// ✅ Generate static paths - DIRECT DATABASE ACCESS (NO HTTP)
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

// ✅ Fetch store data - DIRECT DATABASE ACCESS
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

// ✅ Fetch products - DIRECT DATABASE ACCESS
async function getStoreProducts(
  storeId: string,
  storeSlug: string
): Promise<ProductData[]> {
  try {
    console.log("🔍 Fetching products from database for store:", storeId);
    await connectToDB();

    const store = (await Store.findOne({ slug: storeSlug }).lean()) as any;
    if (!store) {
      console.log("⚠️ Store not found for products lookup:", storeSlug);
      return [];
    }

    let products: any[] = [];

    products = (await Product.find({ storeId: store._id, isPublished: true })
      .populate("images")
      .lean()) as any[];

    console.log(
      "🔍 Try 1 (with isPublished): Found",
      products.length,
      "products"
    );

    if (!products || products.length === 0) {
      console.log("🔍 Try 2: Fetching without isPublished filter...");
      products = (await Product.find({ storeId: store._id })
        .populate("images")
        .lean()) as any[];
      console.log(
        "🔍 Try 2 (without isPublished): Found",
        products.length,
        "products"
      );
    }

    if (!products || products.length === 0) {
      console.log("🔍 Try 3: Fetching with string storeId comparison...");
      products = (await Product.find({ storeId: store._id.toString() })
        .populate("images")
        .lean()) as any[];
      console.log(
        "🔍 Try 3 (string comparison): Found",
        products.length,
        "products"
      );
    }

    if (!products || products.length === 0) {
      console.log(
        "⚠️ No products found for store after all attempts:",
        storeSlug
      );
      return [];
    }

    console.log("✅ Products fetched successfully:", products.length);

    return products.map((product: any) => ({
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
    }));
  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return [];
  }
}

// ✅ Generate metadata
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

// ✅ Main page component
export default async function StorePage({ params }: StorePageProps) {
  try {
    const { slug } = await params;
    console.log("🎯 Rendering store page for slug:", slug);

    const store = await getStore(slug);

    if (!store) {
      console.log("❌ Store not found, showing 404");
      notFound();
    }

    const storeProducts = await getStoreProducts(store.id, slug);

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Visit Tracker */}
        <VisitTracker storeId={store.id} />

        {/* Store Banner with Overlay Effect */}
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

        {/* Store Header Section */}
        <div className="relative -mt-16 md:-mt-20">
          <div className="container mx-auto lg:px-8">
            <Card className="border-none md:border-2 shadow-xl">
              <CardContent className=" p-2 md:p-8">
                <div className="flex flex-col gap-6 md:gap-8">
                  {/* Store Logo */}
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
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1.5"
                            >
                              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                              Open Now
                            </Badge>
                          </div>
                        </div>

                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-[12px] md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>9:00 AM - 9:00 PM</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1.5">
                          <Package className="h-4 w-4 text-primary" />
                          <span>{storeProducts.length} Products</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Store Details */}
                  <div className="flex-1 min-w-0 space-y-4">
                    {/* Store Description */}
                    {store.description && (
                      <div>
                        <ExpandableText text={store.description} limit={180} />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Store Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {storeProducts.length}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    Total Products
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    4.8
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                    Store Rating
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    127
                  </div>
                  <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                    Orders Completed
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    98%
                  </div>
                  <div className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                    Positive Reviews
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-screen-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Featured Products
                </h2>
                <p className="text-muted-foreground">
                  Discover our carefully curated collection
                </p>
              </div>
              {storeProducts.length > 0 && (
                <Button variant="ghost" className="hidden md:flex gap-2">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {storeProducts.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
