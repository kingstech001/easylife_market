"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Save,
  ImageIcon,
  Package,
  Store,
  Settings,
  Upload,
  X,
  Edit3,
  Tag,
  Box,
  Sparkles,
  LucideImage,
  Check,
  Palette,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import ExpandableText from "@/components/ExpandableText";
import ProductVariantsEditor, {
  type ProductVariant,
} from "@/components/ProductVariantsEditor";

// Categories that support variants
const VARIANT_CATEGORIES = [
  "Clothing",
  "Fashion",
  "Apparel",
  "Shoes",
  "Footwear",
  "Accessories",
  "Jewelry",
  "Bags",
  "Sportswear",
  "Underwear",
  "Swimwear",
  "Beauty",
  "Fragrance",
  "PersonalCare",
  "Cosmetics",
  "Beauty",
];

function categorySupportsVariants(category: string | undefined): boolean {
  if (!category) return false;
  const normalizedCategory = category.toLowerCase().trim();
  return VARIANT_CATEGORIES.some(
    (vc) =>
      normalizedCategory.includes(vc.toLowerCase()) ||
      vc.toLowerCase().includes(normalizedCategory),
  );
}

const variantSchema = z.object({
  color: z.object({
    name: z.string().min(1, "Color name is required"),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  }),
  sizes: z
    .array(
      z.object({
        size: z.string().min(1, "Size is required"),
        quantity: z.number().min(0, "Quantity must be non-negative"),
      }),
    )
    .min(1, "At least one size is required"),
  priceAdjustment: z.number().optional(),
});

const productSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  name: z.string().min(3, "Product name must be at least 3 characters."),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number."),
  compareAtPrice: z
    .union([
      z.coerce.number().positive("Compare at price must be positive."),
      z.literal(""),
      z.undefined(),
    ])
    .optional(),
  category: z.string().optional(),
  inventoryQuantity: z.coerce
    .number()
    .int()
    .nonnegative("Inventory must be a non-negative integer."),
  images: z
    .array(
      z.object({
        url: z.string().url("Invalid image URL."),
        altText: z.string().optional(),
      }),
    )
    .optional(),
  hasVariants: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function StoreBuilderPage() {
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<ProductFormValues[]>([]);
  const DRAFT_KEY = "store-builder:product-draft-v1";
  const [loading, setLoading] = useState(true);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPublishingStore, setIsPublishingStore] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [editingProduct, setEditingProduct] =
    useState<ProductFormValues | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseSave = useRef(false);
  const formSectionRef = useRef<HTMLDivElement>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      compareAtPrice: undefined,
      category: "",
      inventoryQuantity: 0,
      images: [],
      hasVariants: false,
      variants: [],
    },
  });

  const watchedImages = form.watch("images");
  const watchedCategory = form.watch("category");
  const watchedHasVariants = form.watch("hasVariants");
  const watchedVariants = form.watch("variants");

  // Check if current category supports variants
  const supportsVariants = useMemo(() => {
    return categorySupportsVariants(watchedCategory);
  }, [watchedCategory]);

  // Reset variants when category changes to non-supporting
  useEffect(() => {
    if (!supportsVariants && watchedHasVariants) {
      form.setValue("hasVariants", false);
      form.setValue("variants", []);
    }
  }, [supportsVariants, watchedHasVariants, form]);

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.values) {
          form.reset(parsed.values);
        }
      }
    } catch (err) {
      console.warn("Failed to load product draft:", err);
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (pauseSave.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ values, updatedAt: Date.now() }),
          );
        } catch (err) {
          console.warn("Failed to save product draft:", err);
        }
      }, 400);
    });
    return () => {
      subscription.unsubscribe();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [form]);

  // Fetch store and products
  useEffect(() => {
    async function fetchData() {
      try {
        const storeRes = await fetch("/api/dashboard/seller/store");

        if (!storeRes.ok) {
          const errorData = await storeRes
            .json()
            .catch(() => ({ message: "Unknown error" }));
          throw new Error(
            `Failed to fetch store: ${errorData.message || storeRes.statusText}`,
          );
        }
        const { store } = await storeRes.json();
        setStore(store);

        const productRes = await fetch("/api/dashboard/seller/products");
        if (!productRes.ok) {
          const errorData = await productRes
            .json()
            .catch(() => ({ message: "Unknown error" }));
          throw new Error(
            `Failed to fetch products: ${errorData.message || productRes.statusText}`,
          );
        }
        const { products } = await productRes.json();
        setProducts(products || []);
      } catch (error: any) {
        console.error("Error during data fetch:", error);
        toast.error(
          error.message ||
            "Failed to fetch store or products. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleEdit = (p: ProductFormValues) => {
    pauseSave.current = true;

    const { id, _id, ...productData } = p;
    setEditingProduct(p);

    // Reset form with the product data
    form.reset({
      ...productData,
      category: productData.category || "",
      description: productData.description || "",
      compareAtPrice: productData.compareAtPrice || undefined,
      images: productData.images || [],
      hasVariants: productData.hasVariants || false,
      variants: productData.variants || [],
    });

    // Clear localStorage draft
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      console.warn("Failed to clear draft:", err);
    }

    // Resume auto-save after a delay
    setTimeout(() => {
      pauseSave.current = false;
      formSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleDelete = async (productId: string) => {
    if (!productId) return;

    setIsDeletingProduct(true);
    try {
      const res = await fetch(`/api/dashboard/seller/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          `Failed to delete product: ${errorData.message || res.statusText}`,
        );
      }
      setProducts(products.filter((p) => (p.id || p._id) !== productId));
      toast.success("Product deleted successfully");

      if ((editingProduct?.id || editingProduct?._id) === productId) {
        setEditingProduct(null);
        form.reset(
          {
            name: "",
            description: "",
            price: 0,
            category: "",
            inventoryQuantity: 0,
            images: [],
            hasVariants: false,
            variants: [],
          },
          { keepValues: false },
        );
        setActiveTab("details");
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete product");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleSubmit = async (data: ProductFormValues) => {
    // Validate form before proceeding
    const isValid = await form.trigger();
    if (!isValid) {
      toast.error("Please fix all validation errors before saving");
      return;
    }

    const editingId = editingProduct?.id || editingProduct?._id;
    const isCreating = !editingId;

    if (products.length >= 10 && isCreating) {
      toast.error(
        "Maximum of 10 products reached. Delete an existing product to add a new one.",
      );
      return;
    }

    if (!store?._id) {
      toast.error("No store found. Please ensure your store is set up.");
      return;
    }

    setIsSavingProduct(true);

    try {
      // Calculate total inventory from variants if hasVariants is true
      let totalInventory = data.inventoryQuantity;
      if (data.hasVariants && data.variants && data.variants.length > 0) {
        totalInventory = data.variants.reduce((total, variant) => {
          return (
            total +
            variant.sizes.reduce(
              (sizeTotal, size) => sizeTotal + size.quantity,
              0,
            )
          );
        }, 0);
      }

      const cleanedData = {
        name: data.name,
        description: data.description || "",
        price: Number(data.price),
        category: data.category || "",
        inventoryQuantity: totalInventory,
        images: data.images || [],
        storeId: store._id,
        hasVariants: data.hasVariants || false,
        variants: data.hasVariants ? data.variants || [] : [],
      };

      let resultProduct: ProductFormValues;

      if (editingId) {
        const res = await fetch(`/api/dashboard/seller/products/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanedData),
        });

        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(
            `Failed to update product: ${responseData.message || responseData.error || res.statusText}`,
          );
        }

        resultProduct = responseData.data;
        setProducts((prev) =>
          prev.map((p) => {
            const pId = p.id || p._id;
            const rId = resultProduct.id || resultProduct._id;
            return pId === rId ? resultProduct : p;
          }),
        );
        toast.success(responseData.message || "Product updated successfully");
      } else {
        const res = await fetch("/api/dashboard/seller/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanedData),
        });

        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(
            `Failed to add product: ${responseData.message || responseData.error || res.statusText}`,
          );
        }

        resultProduct = responseData.product;
        setProducts((prev) => [...prev, resultProduct]);
        toast.success(responseData.message || "Product added successfully");
      }

      // Clear form and reset state
      pauseSave.current = true;
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (err) {
        console.warn("Failed to clear draft:", err);
      }

      setEditingProduct(null);

      form.reset(
        {
          name: "",
          description: "",
          price: 0,
          compareAtPrice: undefined,
          category: "",
          inventoryQuantity: 0,
          images: [],
          hasVariants: false,
          variants: [],
        },
        { keepValues: false },
      );

      try {
        const uploadInput = document.getElementById(
          "upload",
        ) as HTMLInputElement | null;
        if (uploadInput) uploadInput.value = "";
      } catch (err) {
        console.warn("Failed to clear upload input:", err);
      }

      setActiveTab("details");

      setTimeout(() => {
        pauseSave.current = false;
      }, 800);
    } catch (error: any) {
      console.error("Save/Update error:", error);
      toast.error(error.message || "Failed to save product");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const publishStore = async () => {
    if (!store?._id) {
      toast.error("No store found to publish.");
      return;
    }

    setIsPublishingStore(true);

    try {
      const res = await fetch("/api/dashboard/seller/store/publish", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: store._id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to publish store: ${res.statusText}`,
        );
      }

      toast.success("Store published successfully!");

      if (data.role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/seller/store");
      }
    } catch (error: any) {
      console.error("Publish error:", error);
      toast.error(error.message || "Failed to publish store");
    } finally {
      setIsPublishingStore(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-muted border-t-[#c0a146] rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="w-8 h-8 text-[#c0a146] animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Loading your store</h3>
            <p className="text-muted-foreground">
              Setting up your workspace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Banner Section */}
      <div className="relative w-full h-64 md:h-80 bg-cover bg-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={
              store?.banner_url ||
              "/placeholder.svg?height=320&width=1200&text=Store+Banner"
            }
            alt="Store Banner"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

        {/* Navigation */}
        <div className="absolute top-6 left-0 right-0 px-4 md:px-8 flex justify-between items-center z-20">
          <Button
            variant="outline"
            onClick={() => router.push("/create-store")}
            className="backdrop-blur-md bg-background/90 hover:bg-background shadow-lg border h-11"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={publishStore}
            disabled={isPublishingStore || !products.length}
            className="h-11 shadow-lg bg-[#c0a146] hover:bg-[#c0a146]/90"
          >
            {isPublishingStore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" /> Publish Store
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Store Info Section */}
      <div className="relative z-30 -mt-24 md:-mt-32 container mx-auto px-4 md:px-8">
        <div className="mt-16">
          <div className="flex flex-col items-start gap-6">
            {store?.logo_url ? (
              <div className="relative flex-shrink-0">
                <Image
                  src={store.logo_url || "/placeholder.svg"}
                  alt="Store Logo"
                  width={112}
                  height={112}
                  className="w-28 h-28 rounded-3xl object-cover border-4 border-background shadow-xl"
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#c0a146] rounded-full border-4 border-background shadow-lg flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-muted border-4 border-background shadow-xl flex items-center justify-center flex-shrink-0">
                <Store className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0 pb-2">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight text-foreground mb-2">
                {store?.name || "Your Store"}
              </h1>
              <div className="mt-2">
                <ExpandableText
                  text={
                    store?.description ??
                    "Add a description to tell customers about your store"
                  }
                  limit={120}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Products Sidebar */}
          <div className="lg:col-span-4">
            <Card className="shadow-xl border-border/50 bg-card/90 backdrop-blur-sm sticky top-8">
              <CardHeader className="pb-4 border-b">
                <div className="flex justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#c0a146]/10">
                      <Package className="w-5 h-5 text-[#c0a146]" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Products</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {products.length} / 10
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={products.length >= 10}
                    onClick={() => {
                      setEditingProduct(null);
                      form.reset({
                        name: "",
                        description: "",
                        price: 0,
                        compareAtPrice: undefined,
                        category: "",
                        inventoryQuantity: 0,
                        images: [],
                        hasVariants: false,
                        variants: [],
                      });
                      setActiveTab("details");
                      try {
                        localStorage.removeItem(DRAFT_KEY);
                      } catch {}
                      setTimeout(() => {
                        formSectionRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }, 100);
                    }}
                    className="bg-[#c0a146] hover:bg-[#c0a146]/90 h-9"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto">
                <AnimatePresence>
                  {products.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="font-semibold mb-2">No products yet</h3>
                      <p className="text-sm">
                        Add your first product to get started
                      </p>
                    </motion.div>
                  ) : (
                    products.map((p, index) => {
                      const uniqueKey = p.id || p._id || `product-${index}`;
                      const productId = p.id || p._id;
                      const editingId =
                        editingProduct?.id || editingProduct?._id;
                      const isEditing = editingId === productId;
                      return (
                        <motion.div
                          key={uniqueKey}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all duration-300 hover:shadow-lg group ${
                              isEditing
                                ? "border-[#c0a146] bg-[#c0a146]/5 shadow-lg"
                                : "border-border hover:border-[#c0a146]/50 bg-background"
                            }`}
                            onClick={() => handleEdit(p)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-3">
                                    <h3 className="font-semibold truncate">
                                      {p.name}
                                    </h3>
                                    {isEditing && (
                                      <Badge className="bg-[#c0a146] text-white border-0">
                                        <Edit3 className="w-3 h-3 mr-1" />
                                        Editing
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1 font-medium text-foreground">
                                      <span className="text-base">N</span>
                                      {p.price.toFixed(2)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Box className="w-3 h-3" />
                                      {p.inventoryQuantity} in stock
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {p.category && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs border-[#c0a146]/30"
                                      >
                                        <Tag className="w-2 h-2 mr-1" />
                                        {p.category}
                                      </Badge>
                                    )}
                                    {p.hasVariants && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        <Palette className="w-2 h-2 mr-1" />
                                        {p.variants?.length || 0} variants
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (productId) handleDelete(productId);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Product Form */}
          <div className="lg:col-span-8" ref={formSectionRef}>
            <AnimatePresence mode="wait">
              <motion.div
                key={editingProduct?.id || editingProduct?._id || "new"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-xl border-border/50 bg-card/90 backdrop-blur-sm">
                  <CardHeader className="pb-6 p-3 border-b">
                    <div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-[#c0a146]/10">
                          {editingProduct ? (
                            <Edit3 className="w-6 h-6 text-[#c0a146]" />
                          ) : (
                            <Plus className="w-6 h-6 text-[#c0a146]" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-2xl">
                            {editingProduct
                              ? "Edit Product"
                              : "Add New Product"}
                          </CardTitle>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {editingProduct
                              ? "Update your product details"
                              : "Create a new product for your store"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-end justify-end mt-2">
                        {editingProduct && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingProduct(null);
                              form.reset({
                                name: "",
                                description: "",
                                price: 0,
                                compareAtPrice: undefined,
                                category: "",
                                inventoryQuantity: 0,
                                images: [],
                                hasVariants: false,
                                variants: [],
                              });
                              setActiveTab("details");
                              try {
                                localStorage.removeItem(DRAFT_KEY);
                              } catch {}
                            }}
                            className="h-9 mr-0 bg-transparent"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 md:p-8">
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(handleSubmit)}
                        className="space-y-6"
                      >
                        <Tabs
                          value={activeTab}
                          onValueChange={setActiveTab}
                          className="space-y-8"
                        >
                          <TabsList className="grid w-full grid-cols-4 bg-muted p-1 rounded-xl h-12">
                            <TabsTrigger
                              value="details"
                              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">Details</span>
                            </TabsTrigger>
                            <TabsTrigger
                              value="images"
                              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">Images</span>
                            </TabsTrigger>
                            <TabsTrigger
                              value="inventory"
                              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                            >
                              <Box className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">
                                Inventory
                              </span>
                            </TabsTrigger>
                            <TabsTrigger
                              value="variants"
                              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                              disabled={!supportsVariants}
                            >
                              <Palette className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">Variants</span>
                            </TabsTrigger>
                          </TabsList>

                          {/* Details Tab */}
                          <TabsContent
                            value="details"
                            className="space-y-6 mt-8"
                          >
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base">
                                    Product Name *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter a compelling product name"
                                      className="h-12"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Choose a clear and descriptive name
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-base">
                                      Price (₦) *
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c0a146] text-lg">
                                          ₦
                                        </span>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          placeholder="0.00"
                                          className="pl-12 h-12"
                                          {...field}
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-base">
                                      Category
                                    </FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#c0a146]" />
                                        <Input
                                          placeholder="e.g., Electronics, Clothing"
                                          className="pl-12 h-12"
                                          {...field}
                                        />
                                      </div>
                                    </FormControl>
                                    {supportsVariants && (
                                      <FormDescription className="flex items-center gap-1 text-[#c0a146]">
                                        <Palette className="w-3 h-3" />
                                        This category supports color/size
                                        variants
                                      </FormDescription>
                                    )}
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-base">
                                    Description
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Describe your product in detail. What makes it special?"
                                      rows={5}
                                      className="resize-none"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Help customers understand your product
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TabsContent>

                          {/* Images Tab */}
                          <TabsContent
                            value="images"
                            className="space-y-6 mt-8"
                          >
                            <div className="flex items-center gap-3 pb-4 border-b">
                              <div className="p-2 rounded-lg bg-[#c0a146]/10">
                                <ImageIcon className="h-5 w-5 text-[#c0a146]" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">
                                  Product Images
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Add high-quality images to showcase your
                                  product
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-center">
                              <label
                                htmlFor="upload"
                                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium bg-[#c0a146] text-white rounded-xl cursor-pointer hover:bg-[#c0a146]/90 transition-all shadow-lg hover:shadow-xl"
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Image
                              </label>
                              <input
                                id="upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast.error("Image must be less than 5MB");
                                    return;
                                  }
                                  const formData = new FormData();
                                  formData.append("file", file);
                                  setIsUploadingImage(true);
                                  try {
                                    const res = await fetch("/api/upload", {
                                      method: "POST",
                                      body: formData,
                                    });
                                    if (!res.ok)
                                      throw new Error("Failed to upload");
                                    const { secure_url } = await res.json();
                                    const existingImages = watchedImages ?? [];
                                    form.setValue(
                                      "images",
                                      [
                                        ...existingImages,
                                        {
                                          url: secure_url,
                                          altText: `${form.getValues("name") || "Product"} image ${existingImages.length + 1}`,
                                        },
                                      ],
                                      { shouldDirty: true },
                                    );
                                    toast.success(
                                      "Image uploaded successfully",
                                    );
                                  } catch (err) {
                                    console.error(err);
                                    toast.error("Image upload failed");
                                  } finally {
                                    setIsUploadingImage(false);
                                  }
                                }}
                              />
                            </div>

                            <Separator />

                            {/* Image Gallery */}
                            {(watchedImages ?? []).length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {(watchedImages ?? []).map((img, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="relative group"
                                  >
                                    <div className="aspect-square rounded-2xl overflow-hidden border-2 border-border group-hover:border-[#c0a146] transition-colors shadow-lg group-hover:shadow-xl">
                                      <Image
                                        src={img.url || "/placeholder.svg"}
                                        alt={
                                          img.altText ||
                                          `Product image ${idx + 1}`
                                        }
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-full shadow-lg"
                                      onClick={() => {
                                        const currentImages =
                                          watchedImages ?? [];
                                        form.setValue(
                                          "images",
                                          currentImages.filter(
                                            (_, i) => i !== idx,
                                          ),
                                          { shouldDirty: true },
                                        );
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                    {idx === 0 && (
                                      <Badge className="absolute bottom-3 left-3 bg-[#c0a146] text-white border-0 shadow-lg">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Main
                                      </Badge>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-16 text-center bg-muted/20">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                                  <LucideImage className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                  No images yet
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                  Upload your first product image to get started
                                </p>
                              </div>
                            )}
                          </TabsContent>

                          {/* Inventory Tab */}
                          <TabsContent
                            value="inventory"
                            className="space-y-6 mt-8"
                          >
                            <div className="flex items-center gap-3 pb-4 border-b">
                              <div className="p-2 rounded-lg bg-[#c0a146]/10">
                                <Box className="h-5 w-5 text-[#c0a146]" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">
                                  Inventory Management
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Track your product stock levels
                                </p>
                              </div>
                            </div>

                            {watchedHasVariants ? (
                              <div className="rounded-lg bg-[#c0a146]/10 border border-[#c0a146]/20 p-4">
                                <div className="flex items-start gap-3">
                                  <Palette className="h-5 w-5 text-[#c0a146] mt-0.5" />
                                  <div className="text-sm">
                                    <p className="font-medium text-foreground mb-1">
                                      Variants Enabled
                                    </p>
                                    <p className="text-muted-foreground">
                                      Inventory is managed per variant. Go to
                                      the Variants tab to set quantities for
                                      each color/size combination.
                                    </p>
                                    <p className="text-[#c0a146] font-medium mt-2">
                                      Total inventory:{" "}
                                      {watchedVariants?.reduce(
                                        (total, v) =>
                                          total +
                                          v.sizes.reduce(
                                            (st, s) => st + s.quantity,
                                            0,
                                          ),
                                        0,
                                      ) || 0}{" "}
                                      items
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="max-w-md">
                                <FormField
                                  control={form.control}
                                  name="inventoryQuantity"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-base">
                                        Stock Quantity *
                                      </FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Box className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#c0a146]" />
                                          <Input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            className="pl-12 h-12"
                                            {...field}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormDescription>
                                        How many units do you have in stock?
                                      </FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}

                            <div className="rounded-lg bg-[#c0a146]/10 border border-[#c0a146]/20 p-4 max-w-md">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <Sparkles className="h-5 w-5 text-[#c0a146]" />
                                </div>
                                <div className="text-sm">
                                  <p className="font-medium text-foreground mb-1">
                                    Inventory Tip
                                  </p>
                                  <p className="text-muted-foreground">
                                    Keep your stock levels updated to avoid
                                    overselling and maintain customer trust.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          {/* Variants Tab */}
                          <TabsContent
                            value="variants"
                            className="space-y-6 mt-8"
                          >
                            {supportsVariants ? (
                              <>
                                <div className="flex flex-col sm:flex-row iitems-start sm:items-center justify-between pb-4 border-b">
                                  <div className="space-y-1 mb-2 sm:mb-0">
                                    <div className="flex items-center">
                                      <div className="p-2 rounded-lg bg-[#c0a146]/10">
                                        <Palette className="h-5 w-5 text-[#c0a146]" />
                                      </div>
                                      <h3 className="text-lg font-semibold">
                                        Color & Size Variants
                                      </h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Add different colors and sizes for your{" "}
                                      {watchedCategory || "product"}
                                    </p>
                                  </div>
                                  <FormField
                                    control={form.control}
                                    name="hasVariants"
                                    render={({ field }) => (
                                      <FormItem className="flex items-center gap-2">
                                        <FormLabel className="text-sm font-normal">
                                          Enable variants
                                        </FormLabel>
                                        <FormControl>
                                          <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            style={{ margin: "0" }}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                {watchedHasVariants ? (
                                  <ProductVariantsEditor
                                    variants={
                                      (watchedVariants as ProductVariant[]) ||
                                      []
                                    }
                                    onChange={(newVariants) => {
                                      form.setValue("variants", newVariants, {
                                        shouldDirty: true,
                                      });
                                    }}
                                    category={watchedCategory}
                                  />
                                ) : (
                                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-12 text-center bg-muted/20">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                                      <Palette className="w-8 h-8 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">
                                      Variants Disabled
                                    </h3>
                                    <p className="text-muted-foreground text-sm mb-4">
                                      Enable variants to add color and size
                                      options to your product
                                    </p>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        form.setValue("hasVariants", true)
                                      }
                                      className="bg-transparent"
                                    >
                                      <Palette className="w-4 h-4 mr-2" />
                                      Enable Variants
                                    </Button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-12 text-center bg-muted/20">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                                  <Palette className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                  Variants Not Available
                                </h3>
                                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                  Color and size variants are only available for
                                  clothing, fashion, and related categories.
                                  Update your product category to enable this
                                  feature.
                                </p>
                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                  {VARIANT_CATEGORIES.slice(0, 6).map((cat) => (
                                    <Badge
                                      key={cat}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {cat}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>

                        <div className="flex justify-end pt-6 border-t">
                          <Button
                            type="submit"
                            disabled={
                              isSavingProduct ||
                              (products.length >= 10 && !editingProduct)
                            }
                            className="bg-[#c0a146] hover:bg-[#c0a146]/90 text-white shadow-lg hover:shadow-xl px-8 h-12 font-semibold"
                          >
                            {isSavingProduct ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                {editingProduct ? "Updating..." : "Saving..."}
                              </>
                            ) : (
                              <>
                                <Save className="h-5 w-5 mr-2" />
                                {editingProduct
                                  ? "Update Product"
                                  : "Save Product"}
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
