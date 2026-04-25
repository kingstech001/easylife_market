import { connectToDB } from "@/lib/db";
import Product from "@/models/Product";
import Store from "@/models/Store";
import AllStoreProductsClient from "./AllStoreProductsClient";

type TransformedProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  inventory_quantity: number;
  images: { id: string; url: string; alt_text: string | null }[];
  store_id: string;
  store_slug?: string;
  created_at: string;
  updated_at: string;
};

async function getProducts(): Promise<TransformedProduct[]> {
  try {
    await connectToDB();

    // Ensure Store model is registered
    if (!Store) {
      console.error("Store model not found");
    }

    const products = await Product.find({
      isActive: true,
      isDeleted: false,
    })
      .populate({
        path: "storeId",
        select: "_id name slug",
        model: "Store",
      })
      .sort({ createdAt: -1 })
      .lean();

    return products
      .filter((p: any) => p.storeId)
      .map((p: any) => {
        const productImages = p.images || [];
        const storeId =
          typeof p.storeId === "string" ? p.storeId : p.storeId?._id?.toString() || "";
        const storeSlug =
          typeof p.storeId === "object" && p.storeId?.slug ? p.storeId.slug : "";

        return {
          id: p._id.toString(),
          name: p.name || "Unnamed Product",
          description: p.description || null,
          price: p.price || 0,
          compare_at_price: p.compareAtPrice || null,
          inventory_quantity: p.inventoryQuantity ?? 0,
          images: productImages.map((img: any) => ({
            id: img._id?.toString() || img.id || "",
            url: img.url || "",
            alt_text: img.altText || img.alt_text || null,
          })),
          store_id: storeId,
          store_slug: storeSlug,
          created_at: p.createdAt?.toISOString() || new Date().toISOString(),
          updated_at: p.updatedAt?.toISOString() || new Date().toISOString(),
        };
      });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

const BANNER_THEMES = [
  {
    id: "restaurant-1",
    query: "restaurant dining food",
    title: "Discover Great Restaurants",
    subtitle: "Order from your favorite local spots and enjoy meals made with care.",
    fallbackImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0",
  },
  {
    id: "restaurant-2",
    query: "fresh meals restaurant kitchen",
    title: "Fresh and Delicious",
    subtitle: "Explore restaurant meals, chef specials, and daily food favorites.",
    fallbackImageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
  },
  {
    id: "grocery-1",
    query: "grocery supermarket fresh produce",
    title: "Grocery and Food Stores",
    subtitle: "Shop fresh produce, pantry essentials, and everyday home needs.",
    fallbackImageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e",
  },
  {
    id: "retail-1",
    query: "shopping ecommerce retail store",
    title: "Discover Quality Products",
    subtitle: "Browse our curated collection from trusted sellers.",
    fallbackImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
  },
  {
    id: "fashion-1",
    query: "fashion lifestyle clothing store",
    title: "Fashion Forward",
    subtitle: "Discover standout styles, seasonal looks, and fashion essentials.",
    fallbackImageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050",
  },
  {
    id: "tech-1",
    query: "tech gadgets electronics store",
    title: "Tech and Innovation",
    subtitle: "Discover the latest gadgets, devices, and digital essentials.",
    fallbackImageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661",
  },
];

async function getHeroBanner() {
  try {
    const theme = BANNER_THEMES[Math.floor(Math.random() * BANNER_THEMES.length)];
    let imageUrl = theme.fallbackImageUrl;

    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    if (unsplashKey) {
      try {
        const res = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(theme.query)}&orientation=landscape&content_filter=high`,
          {
            headers: { Authorization: `Client-ID ${unsplashKey}` },
            signal: AbortSignal.timeout(5000),
          }
        );
        if (res.ok) {
          const data = await res.json();
          imageUrl = data.urls?.regular || imageUrl;
        }
      } catch {
        // Use fallback image
      }
    }

    return {
      id: theme.id,
      imageUrl,
      title: theme.title,
      subtitle: theme.subtitle,
    };
  } catch {
    return null;
  }
}

export default async function ProductsPage() {
  const [products, banner] = await Promise.all([
    getProducts(),
    getHeroBanner(),
  ]);

  return (
    <AllStoreProductsClient
      initialProducts={products}
      initialBanner={banner}
    />
  );
}
