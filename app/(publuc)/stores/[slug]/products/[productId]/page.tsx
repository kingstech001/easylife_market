"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Share2,
  Star,
  ChevronLeft,
  Check,
  Info,
  Loader2,
  Package,
  Truck,
  ShieldCheck,
  Clock,
  Store as StoreIcon,
  BadgeCheck,
  Minus,
  Plus,
  MapPin,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { use } from "react";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { toast } from "sonner";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import ExpandableText from "@/components/ExpandableText";

// Types
interface VariantColor {
  name: string;
  hex: string;
  _id?: string;
}

interface VariantSize {
  size: string;
  quantity: number;
  _id?: string;
}

interface ProductVariant {
  color: VariantColor;
  sizes: VariantSize[];
  priceAdjustment?: number;
  _id?: string;
}

interface Product {
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
  variants?: ProductVariant[] | string; // Could be string if not parsed
}

interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
}

export default function ProductPage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatAmount } = useFormatAmount();
  const [error, setError] = useState<string | null>(null);

  // Variant selection states
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // ⭐ Parse variants if they come as a string (same logic as ProductCard)
  const getParsedVariants = (): ProductVariant[] | undefined => {
    if (!product?.variants) return undefined;
    
    try {
      if (typeof product.variants === 'string') {
        console.log('⚠️ [ProductPage] Variants is a STRING, attempting to parse...');
        const parsed = JSON.parse(product.variants) as ProductVariant[];
        console.log('✅ [ProductPage] Successfully parsed variants:', parsed);
        return parsed;
      } else if (Array.isArray(product.variants)) {
        console.log('✅ [ProductPage] Variants is already an array:', product.variants);
        return product.variants;
      }
    } catch (error) {
      console.error('❌ [ProductPage] Error parsing variants:', error);
      console.log('Raw variants value:', product.variants);
    }
    
    return undefined;
  };

  // Get parsed variants
  const parsedVariants = getParsedVariants();

  // Debug logging
  useEffect(() => {
    if (product) {
      console.log('🎨 [parsedVariants] Product updated');
      console.log('🎨 [parsedVariants] hasVariants:', product.hasVariants);
      console.log('🎨 [parsedVariants] raw variants:', product.variants);
      console.log('🎨 [parsedVariants] parsed variants:', parsedVariants);
      console.log('🎨 [parsedVariants] parsed length:', parsedVariants?.length);
    }
  }, [product, parsedVariants]);

  // Fetch product data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const productResponse = await fetch(
          `/api/stores/${params.slug}/products/${params.productId}`
        );

        if (!productResponse.ok) {
          if (productResponse.status === 404) {
            setError("Product not found");
            return;
          }
          throw new Error("Failed to fetch product");
        }

        const productData = await productResponse.json();
        if (!productData.success) {
          throw new Error(productData.message || "Failed to fetch product");
        }

        console.log('🔍 [ProductPage] Full API Response:', productData);
        console.log('🔍 [ProductPage] Product Object:', productData.product);
        console.log('🔍 [ProductPage] Has Variants:', productData.product.hasVariants);
        console.log('🔍 [ProductPage] Variants Raw:', productData.product.variants);
        console.log('🔍 [ProductPage] Variants Type:', typeof productData.product.variants);
        console.log('🔍 [ProductPage] Is Array:', Array.isArray(productData.product.variants));

        setProduct(productData.product);

        // Log variant info for debugging
        if (productData.product.hasVariants) {
          console.log('📦 [ProductPage] Product has variants flag:', productData.product.hasVariants);
          console.log('📦 [ProductPage] Raw variants:', productData.product.variants);
          console.log('📦 [ProductPage] Variants type:', typeof productData.product.variants);
          
          if (typeof productData.product.variants === 'string') {
            try {
              const testParse = JSON.parse(productData.product.variants);
              console.log('📦 [ProductPage] Test parse successful:', testParse);
            } catch (e) {
              console.error('📦 [ProductPage] Test parse failed:', e);
            }
          }
        }

        const storeResponse = await fetch(`/api/stores/${params.slug}`);
        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          if (storeData.success) {
            setStore(storeData.store);
          }
        }

        const relatedResponse = await fetch(
          `/api/stores/${params.slug}/products`
        );
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          if (relatedData.success) {
            const filtered = relatedData.products
              .filter((p: Product) => p.id !== params.productId)
              .slice(0, 4);
            setRelatedProducts(filtered);
          }
        }
      } catch (err) {
        console.error("Error fetching product data:", err);
        setError(err instanceof Error ? err.message : "Failed to load product");
        toast.error("Failed to load product", {
          description: "Please try again later",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.slug, params.productId]);

  // Auto-select first variant when parsed variants become available
  useEffect(() => {
    if (product?.hasVariants && parsedVariants && parsedVariants.length > 0 && !selectedColor) {
      const firstVariant = parsedVariants[0];
      console.log('🎯 [ProductPage] Auto-selecting first variant:', firstVariant);
      setSelectedColor(firstVariant.color.name);
      if (firstVariant.sizes.length > 0) {
        setSelectedSize(firstVariant.sizes[0].size);
      }
    }
  }, [product?.hasVariants, parsedVariants, selectedColor]);

  // Get available sizes for selected color
  const getAvailableSizes = (): VariantSize[] => {
    if (!product?.hasVariants || !parsedVariants || !selectedColor) return [];
    
    const variant = parsedVariants.find((v: ProductVariant) => v.color.name === selectedColor);
    return variant?.sizes || [];
  };

  // Get current stock based on selection
  const getCurrentStock = (): number => {
    if (!product?.hasVariants || !selectedColor || !selectedSize) {
      return product?.inventory_quantity || 0;
    }

    const variant = parsedVariants?.find((v: ProductVariant) => v.color.name === selectedColor);
    const sizeData = variant?.sizes.find((s: VariantSize) => s.size === selectedSize);
    return sizeData?.quantity || 0;
  };

  // Get current price with variant adjustment
  const getCurrentPrice = (): number => {
    if (!product) return 0;
    
    if (!product.hasVariants || !selectedColor) {
      return product.price;
    }

    const variant = parsedVariants?.find((v: ProductVariant) => v.color.name === selectedColor);
    return product.price + (variant?.priceAdjustment || 0);
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Check if variants are selected
    if (product.hasVariants) {
      if (!selectedColor) {
        toast.error("Please select a color");
        return;
      }
      if (!selectedSize) {
        toast.error("Please select a size");
        return;
      }
    }

    const currentStock = getCurrentStock();
    if (currentStock === 0) {
      toast.error("This variant is out of stock");
      return;
    }

    setIsAddingToCart(true);
    setTimeout(() => {
      setIsAddingToCart(false);
      
      // Get the hex color for the selected color
      const selectedVariant = parsedVariants?.find((v: ProductVariant) => v.color.name === selectedColor);
      
      addToCart({
        id: product.id,
        name: product.name,
        price: getCurrentPrice(),
        quantity,
        image: product.images[0]?.url || "/placeholder.svg",
        storeId: product.store_id,
        productId: product.id,
        selectedVariant: product.hasVariants && selectedColor && selectedSize ? {
          color: {
            name: selectedColor,
            hex: selectedVariant?.color.hex || '#000000',
          },
          size: selectedSize,
        } : undefined,
      });
      
      toast.success("Added to cart", {
        description: `${product.name} has been added to your cart`,
      });
    }, 1000);
  };

  const toggleWishlist = () => {
    if (!product || !store) return;

    const wishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || "/placeholder.svg",
      storeSlug: store.slug,
    };

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(wishlistItem);
      toast.success("Added to wishlist");
    }
  };

  const incrementQuantity = () => {
    const currentStock = getCurrentStock();
    if (quantity < currentStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  // Loading state
  if (loading) {
    return (
      <div className="container py-20 text-center flex flex-col items-center h-screen justify-center w-full m-auto">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-lg text-muted-foreground">Loading product details...</p>
      </div>
    );
  }

  // Error state
  if (error || !product || !store) {
    return (
      <div className="container py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Package className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold mb-4">
            {error === "Product not found" ? "Product Not Found" : "Error"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {error ||
              "The product you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => router.back()} size="lg" className="rounded-xl">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) /
          product.compare_at_price!) *
          100
      )
    : 0;

  const currentStock = getCurrentStock();
  const currentPrice = getCurrentPrice();
  const availableSizes = getAvailableSizes();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container py-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <AnimatedContainer animation="fadeIn" className="">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 hover:bg-primary/10 rounded-xl"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </AnimatedContainer>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {/* Product Images Section - Left Side */}
          <div className=" lg:max-w-[600px] mx-auto w-full">
            <AnimatedContainer animation="slideIn" className="space-y-4 sticky top-8">
              {/* Main Image */}
              <Card className="overflow-hidden border-2">
                <div className="relative aspect-square bg-muted">
                  <Image
                    src={
                      product.images[selectedImage]?.url ||
                      "/placeholder.svg?height=800&width=800"
                     || "/placeholder.svg"}
                    alt={product.images[selectedImage]?.alt_text || product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                  {hasDiscount && (
                    <div className="absolute top-6 left-6">
                      <Badge className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 text-sm font-bold shadow-lg">
                        -{discountPercentage}% OFF
                      </Badge>
                    </div>
                  )}
                  {currentStock < 10 && currentStock > 0 && (
                    <div className="absolute top-6 right-6">
                      <Badge className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-4 py-2 shadow-lg ">
                        Only {currentStock} left!
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="flex gap-3 pb-2">
                  {product.images.map((image, index) => (
                    <motion.button
                      key={image.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative aspect-square w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl  transition-all ${
                        selectedImage === index
                          ? "ring-2 ring-[#e1a200] border-primary shadow-lg"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <Image
                        src={image.url || "/placeholder.svg"}
                        alt={image.alt_text || `Product image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-3">
                  <div className="grid grid-cols-3">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-[10px] sm:text-sm font-medium">Secure Payment</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-[10px] sm:text-sm font-medium">Fast Delivery</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                        <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-[10px] sm:text-sm font-medium">Quality Guaranteed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedContainer>
          </div>

          {/* Product Info Section - Right Side */}
          <div className="lg:max-w-[600px] mx-auto w-full">
            <AnimatedContainer animation="slideUp" className="space-y-3">
              {/* Store Badge */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    {store.logo_url ? (
                      <Image
                        src={store.logo_url || "/placeholder.svg"}
                        alt={store.name}
                        width={48}
                        height={48}
                        className="rounded-xl object-cover h-12"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <StoreIcon className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Sold by</p>
                      <p className="font-semibold">{store.name}</p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <BadgeCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Product Title & Rating */}
              <div>
                <h1 className="text-xl lg:text-2xl font-bold leading-tight mb-4">
                  {product.name}
                </h1>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < 4
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-muted-foreground fill-muted-foreground/20"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                  <Separator orientation="vertical" className="h-5" />
                  <span className="text-sm text-muted-foreground">
                    24 reviews
                  </span>
                  <Separator orientation="vertical" className="h-5" />
                  <span className="text-sm text-muted-foreground">
                    156 sold
                  </span>
                </div>

                {/* Price Section */}
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between relative">
                      <div>
                        <div className="flex items-baseline gap-6">
                          <span className="text-2xl font-bold text-primary">
                            {formatAmount(currentPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xl text-muted-foreground line-through">
                              {formatAmount(product.compare_at_price!)}
                            </span>
                          )}
                        </div>
                        {hasDiscount && (
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                            You save {formatAmount(product.compare_at_price! - currentPrice)}
                          </p>
                        )}
                      </div>
                      {hasDiscount && (
                        <Badge className="bg-gradient-to-r from-red-600 to-red-500 text-white text-sm right-0 shadow-lg absolute top-0">
                          -{discountPercentage}%
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Color & Size Selection */}
              {product.hasVariants && parsedVariants && parsedVariants.length > 0 && (
                <Card className="border-2">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm sm:text-lg">Select Color</h3>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {parsedVariants.map((variant: ProductVariant) => (
                          <motion.button
                            key={variant._id || variant.color.name}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedColor(variant.color.name);
                              // Reset size selection when color changes
                              if (variant.sizes.length > 0) {
                                setSelectedSize(variant.sizes[0].size);
                              }
                            }}
                            className={`flex items-center gap-2 px-2 py-2 rounded-xl border-2 transition-all ${
                              selectedColor === variant.color.name
                                ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div
                              className="w-6 h-6 rounded-full border-2 border-muted-foreground/30"
                              style={{ backgroundColor: variant.color.hex }}
                            />
                            
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Size Selection */}
                    {selectedColor && availableSizes.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-sm sm:text-lg">Select Size</h3>
                         
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {availableSizes.map((sizeData: VariantSize) => (
                            <motion.button
                              key={sizeData.size}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedSize(sizeData.size)}
                              disabled={sizeData.quantity === 0}
                              className={`px-3 py-2 rounded-xl border-2 font-medium transition-all ${
                                selectedSize === sizeData.size
                                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/30"
                                  : sizeData.quantity === 0
                                  ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              {sizeData.size}
                              {sizeData.quantity === 0 && (
                                <span className="block text-xs">Out of stock</span>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Stock Status */}
              <Card
                className={`border-2 ${
                  currentStock > 0
                    ? "border-green-200 bg-green-50 dark:bg-green-950/20"
                    : "border-red-200 bg-red-50 dark:bg-red-950/20"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        currentStock > 0
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                          : "bg-red-100 text-red-600 dark:bg-red-900/30"
                      }`}
                    >
                      {currentStock > 0 ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Info className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      {currentStock > 0 ? (
                        <>
                          <p className="font-semibold text-green-900 dark:text-green-100">
                            In Stock
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {currentStock} units available
                            {product.hasVariants && selectedColor && selectedSize && 
                              ` (${selectedColor} - ${selectedSize})`
                            }
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-red-900 dark:text-red-100">
                            Out of Stock
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {product.hasVariants && selectedColor && selectedSize
                              ? `This variant (${selectedColor} - ${selectedSize}) is currently unavailable`
                              : "Currently unavailable"
                            }
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quantity & Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 rounded-xl overflow-hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-none hover:bg-primary/10"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="w-16 text-center font-semibold text-lg">
                      {quantity}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-none hover:bg-primary/10"
                      onClick={incrementQuantity}
                      disabled={quantity >= currentStock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    className="flex-1 h-12 text-base font-semibold rounded-xl shadow-lg"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || currentStock === 0}
                  >
                    {isAddingToCart ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Adding...
                      </>
                    ) : currentStock === 0 ? (
                      "Out of Stock"
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl border-2 bg-transparent"
                    onClick={toggleWishlist}
                  >
                    <Heart
                      className={`mr-2 h-5 w-5 transition-colors ${
                        isInWishlist(product.id)
                          ? "fill-red-500 text-red-500"
                          : ""
                      }`}
                    />
                    {isInWishlist(product.id) ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" className="h-12 rounded-xl border-2 bg-transparent">
                    <Share2 className="mr-2 h-5 w-5" />
                    Share
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Product Tabs */}
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="w-full h-12 rounded-xl">
                  <TabsTrigger value="description" className="flex-1 rounded-lg">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex-1 rounded-lg">
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="shipping" className="flex-1 rounded-lg">
                    Shipping
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="pt-6">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <ExpandableText
                        text={
                          product.description ||
                          "No description available for this product."
                        }
                        limit={100}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="details" className="pt-6">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between py-3 border-b">
                        <span className="font-medium flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          SKU
                        </span>
                        <span className="text-muted-foreground font-mono">
                          SKU-{product.id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="font-medium flex items-center gap-2">
                          <StoreIcon className="h-4 w-4 text-primary" />
                          Store
                        </span>
                        <span className="text-muted-foreground">{store.name}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b">
                        <span className="font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Stock
                        </span>
                        <Badge variant="secondary">
                          {currentStock} units
                        </Badge>
                      </div>
                      {product.hasVariants && (
                        <div className="flex justify-between py-3 border-b">
                          <span className="font-medium">Variants</span>
                          <Badge variant="secondary">
                            {parsedVariants?.length || 0} colors available
                          </Badge>
                        </div>
                      )}
                      <div className="flex justify-between py-3">
                        <span className="font-medium flex items-center gap-2">
                          <BadgeCheck className="h-4 w-4 text-primary" />
                          Category
                        </span>
                        <span className="text-muted-foreground">
                          {product.category_id || "Uncategorized"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="shipping" className="pt-6">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 space-y-6">
                      <Separator />

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg mb-1">Fast Delivery</p>
                          <p className="text-sm text-muted-foreground">
                            Estimated delivery: 24 hours
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg mb-1">Track Your Order</p>
                          <p className="text-sm text-muted-foreground">
                            Real-time tracking available after dispatch
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </AnimatedContainer>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <AnimatedContainer animation="fadeIn" delay={0.3} className="mt-20">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">You might also like</h2>
              <p className="text-muted-foreground">
                More great products from {store.name}
              </p>
            </div>

            <div className="grid gap-6 grid-cols-2 sm:grid-cols-auto-fill">
              {relatedProducts.map((relatedProduct) => (
                <motion.div
                  key={relatedProduct.id}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className="overflow-hidden h-full flex flex-col cursor-pointer border-1 hover:border-primary/50 hover:shadow-sm transition-all"
                    onClick={() =>
                      router.push(
                        `/stores/${params.slug}/products/${relatedProduct.id}`
                      )
                    }
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <Image
                        src={relatedProduct.images[0]?.url || "/placeholder.svg"}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover transition-transform hover:scale-110 duration-300"
                      />
                    </div>
                    <CardContent className="p-4 flex-1">
                      <h3 className="font-semibold text-base line-clamp-1 mb-2">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className=" font-bold text-primary">
                          {formatAmount(relatedProduct.price)}
                        </span>
                        {relatedProduct.compare_at_price && (
                          <span className="text-[10px] text-muted-foreground line-through">
                            {formatAmount(relatedProduct.compare_at_price)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatedContainer>
        )}
      </div>
    </div>
  );
}