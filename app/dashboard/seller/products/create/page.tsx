"use client"
import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { z } from "zod"
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  ImageIcon,
  Loader2,
  ShoppingBag,
  Package,
  Tag,
  Layers,
  Upload,
  Check,
  Info,
  Trash2,
  Save,
  RotateCcw,
  Palette,
} from "lucide-react"
import {
  Form,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
  FormField,
  FormControl,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useFormPersistence } from "@/hooks/use-form-persistence"
import ProductVariantsEditor, { type ProductVariant } from "@/components/ProductVariantsEditor"

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
]

function categorySupportsVariants(category: string | undefined): boolean {
  if (!category) return false
  const normalizedCategory = category.toLowerCase().trim()
  return VARIANT_CATEGORIES.some(
    (vc) =>
      normalizedCategory.includes(vc.toLowerCase()) ||
      vc.toLowerCase().includes(normalizedCategory)
  )
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
      })
    )
    .min(1, "At least one size is required"),
  priceAdjustment: z.number().optional(),
})

const productFormSchema = z.object({
  name: z.string().min(3, {
    message: "Product name must be at least 3 characters.",
  }),
  description: z.string().optional(),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  compareAtPrice: z.coerce.number().positive().optional(),
  category: z.string().optional(),
  inventoryQuantity: z.coerce.number().int().nonnegative(),
  images: z
    .array(
      z.object({
        url: z.string(),
        altText: z.string().optional(),
      })
    )
    .optional(),
  storeId: z.string().min(1, { message: "Store ID is required." }),
  hasVariants: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
})

type ProductFormValues = z.infer<typeof productFormSchema>

const categories = [
  "Electronics",
  "Clothing",
  "Fashion",
  "Apparel",
  "Shoes",
  "Accessories",
  "Home & Garden",
  "Sports & Outdoors",
  "Sportswear",
  "Books",
  "Health & Beauty",
  "Toys & Games",
  "Automotive",
  "Food & Beverages",
  "Jewelry",
  "Bags",
  "Underwear",
  "Swimwear",
  "Other",
]

export default function CreateProductPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [isStoreLoading, setIsStoreLoading] = useState(true)
  const [storeError, setStoreError] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      compareAtPrice: undefined,
      category: "",
      inventoryQuantity: 0,
      images: [],
      storeId: "",
      hasVariants: false,
      variants: [],
    },
    mode: "onChange",
  })

  const { clearStorage } = useFormPersistence<ProductFormValues>({
    form,
    storageKey: "create-product-form",
    excludeFields: ["storeId", "inventoryQuantity"],
    debounceMs: 300,
  })

  const watchedCategory = form.watch("category")
  const watchedHasVariants = form.watch("hasVariants")
  const watchedVariants = form.watch("variants")

  // Check if current category supports variants
  const supportsVariants = useMemo(() => {
    return categorySupportsVariants(watchedCategory)
  }, [watchedCategory])

  // Reset variants when category changes to non-supporting
  useEffect(() => {
    if (!supportsVariants && watchedHasVariants) {
      form.setValue("hasVariants", false)
      form.setValue("variants", [])
    }
  }, [supportsVariants, watchedHasVariants, form])

  useEffect(() => {
    const fetchStoreId = async () => {
      setIsStoreLoading(true)
      setStoreError(null)
      try {
        const response = await fetch("/api/dashboard/seller/store")
        if (!response.ok) {
          let errorMessage = "Failed to fetch store information."
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
          } catch (jsonError) {
            try {
              const errorText = await response.text()
              if (errorText) {
                errorMessage = `Server error: ${errorText.substring(0, Math.min(errorText.length, 100))}...`
              }
            } catch {}
          }
          throw new Error(errorMessage)
        }
        const data = await response.json()
        if (data.store && data.store._id) {
          setStoreId(data.store._id)
          form.setValue("storeId", data.store._id)
        } else {
          throw new Error("Store ID not found in response.")
        }
      } catch (err: any) {
        console.error("Error fetching store ID:", err)
        setStoreError(err.message || "Could not load store information.")
        toast.error("Failed to load store information", {
          description: err.message || "Please ensure you are logged in as a seller and have a store.",
        })
      } finally {
        setIsStoreLoading(false)
      }
    }
    fetchStoreId()
  }, [form])

  useEffect(() => {
    const images = form.watch("images")
    if (images && images.length > 0) {
      const urls = images.map((img) => img.url).filter(Boolean)
      setImagePreviews(urls)
    }
  }, [form])

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newFilesArray = Array.from(files).slice(0, 5 - imagePreviews.length)
    if (newFilesArray.length === 0) {
      toast.info("Maximum 5 images allowed.", { description: "Please remove existing images to upload more." })
      return
    }

    setIsUploadingImages(true)
    const uploadedImageUrls: { url: string; altText?: string }[] = []

    for (const file of newFilesArray) {
      if (!file.type.startsWith("image/")) {
        toast.error(`File "${file.name}" is not an image.`)
        continue
      }

      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          let errorMessage = "Image upload failed."
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (jsonError) {
            try {
              const errorText = await response.text()
              if (errorText) {
                errorMessage = `Server error: ${errorText.substring(0, Math.min(errorText.length, 100))}...`
              }
            } catch {}
          }
          throw new Error(errorMessage)
        }

        const result = await response.json()
        uploadedImageUrls.push({
          url: result.secure_url,
          altText: `${form.getValues("name") || "Product"} image ${imagePreviews.length + uploadedImageUrls.length + 1}`,
        })
        setImagePreviews((prev) => [...prev, result.secure_url])
        toast.success(`Image "${file.name}" uploaded.`)
      } catch (error: any) {
        console.error("Error uploading image:", error)
        toast.error(`Failed to upload "${file.name}"`, {
          description: error.message || "Please try again.",
        })
      }
    }

    const currentImages = form.getValues("images") || []
    form.setValue("images", [...currentImages, ...uploadedImageUrls])
    setIsUploadingImages(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleImageUpload(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const removeImage = (index: number) => {
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index)
    const updatedImages = (form.getValues("images") || []).filter((_, i) => i !== index)

    setImagePreviews(updatedPreviews)
    form.setValue("images", updatedImages)
    toast.info("Image removed.")
  }

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    if (!storeId) {
      toast.error("Store information not loaded. Cannot create product.")
      return
    }

    setIsSubmitting(true)
    try {
      // Calculate total inventory from variants if hasVariants is true
      let totalInventory = data.inventoryQuantity
      if (data.hasVariants && data.variants && data.variants.length > 0) {
        totalInventory = data.variants.reduce((total, variant) => {
          return total + variant.sizes.reduce((sizeTotal, size) => sizeTotal + size.quantity, 0)
        }, 0)
      }

      const cleanedData = {
        ...data,
        category: data.category?.trim() || undefined,
        compareAtPrice: data.compareAtPrice || undefined,
        description: data.description?.trim() || undefined,
        inventoryQuantity: totalInventory,
        hasVariants: data.hasVariants || false,
        variants: data.hasVariants ? data.variants || [] : [],
      }

      const response = await fetch("/api/dashboard/seller/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || "Failed to create product")
      }

      const result = await response.json()

      clearStorage()
      setImagePreviews([])

      form.reset({
        name: "",
        description: "",
        price: 0,
        compareAtPrice: undefined,
        category: "",
        inventoryQuantity: 0,
        images: [],
        storeId: storeId,
        hasVariants: false,
        variants: [],
      })

      setFormKey((prev) => prev + 1)
      setActiveTab("details")

      const fileInput = document.getElementById("image-upload") as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }

      toast.success("Product created successfully!", {
        description: "Your product has been added to your store.",
      })
      router.push("/dashboard/seller/products")
    } catch (error: any) {
      console.error("Error creating product:", error)
      toast.error("Failed to create product", {
        description: error.message || "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearForm = () => {
    setImagePreviews([])
    form.reset({
      name: "",
      description: "",
      price: 0,
      compareAtPrice: undefined,
      category: "",
      inventoryQuantity: 0,
      images: [],
      storeId: storeId || "",
      hasVariants: false,
      variants: [],
    })
    setFormKey((prev) => prev + 1)
    setActiveTab("details")
    clearStorage()
    toast.info("Form cleared", {
      description: "All saved data has been removed.",
    })
  }

  if (isStoreLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-4 text-lg text-muted-foreground">Loading store information...</span>
      </div>
    )
  }

  if (storeError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-destructive">
        <p className="text-lg">Error: {storeError}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please ensure you are logged in as a seller and have a store configured.
        </p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-4 hover:bg-muted">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to Products</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 flex-shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create New Product</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Add a new product to your store inventory
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Save className="h-3 w-3 text-green-600" />
                <span className="text-xs text-muted-foreground">Your progress is automatically saved</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearForm}
              className="flex items-center gap-2 bg-transparent"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Clear Form</span>
            </Button>
          </div>
        </motion.div>
        <Form {...form} key={formKey}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-4 h-10 sm:h-12 bg-muted/50 dark:bg-muted/20 p-1">
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="images"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3"
                >
                  <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Images</span>
                </TabsTrigger>
                <TabsTrigger
                  value="inventory"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Inventory</span>
                </TabsTrigger>
                <TabsTrigger
                  value="variants"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3"
                  disabled={!supportsVariants}
                >
                  <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Variants</span>
                </TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-sm bg-card/50 dark:bg-card/20">
                    <CardHeader className="pb-4 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
                        Product Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base">Product Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Premium Wireless Headphones"
                                className="bg-background text-sm sm:text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs sm:text-sm">
                              Choose a clear, descriptive name for your product
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base">Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your product features, benefits, and specifications..."
                                className="resize-none min-h-[100px] sm:min-h-[120px] bg-background text-sm sm:text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs sm:text-sm">
                              Provide detailed information to help customers understand your product
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">Price *</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm sm:text-base">
                                    ₦
                                  </span>
                                  <Input
                                    className="pl-7 sm:pl-8 bg-background text-sm sm:text-base"
                                    type="number"
                                    step="0.01"
                                    min="0"
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
                          name="compareAtPrice"
                          render={({ field: { value, onChange, ...field } }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">Compare-at Price</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm sm:text-base">
                                    ₦
                                  </span>
                                  <Input
                                    className="pl-7 sm:pl-8 bg-background text-sm sm:text-base"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...field}
                                    value={value !== undefined ? value.toString() : ""}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      onChange(val === "" ? undefined : Number(val))
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription className="text-xs sm:text-sm">
                                Original price to show discount (optional)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base">Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger className="bg-background text-sm sm:text-base">
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category} className="text-sm sm:text-base">
                                    {category}
                                    {VARIANT_CATEGORIES.some(
                                      (vc) =>
                                        category.toLowerCase().includes(vc.toLowerCase()) ||
                                        vc.toLowerCase().includes(category.toLowerCase())
                                    ) && (
                                      <span className="ml-2 text-xs text-muted-foreground">(Has variants)</span>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs sm:text-sm">
                              {supportsVariants ? (
                                <span className="flex items-center gap-1 text-primary">
                                  <Palette className="w-3 h-3" />
                                  This category supports color/size variants
                                </span>
                              ) : (
                                "Help customers find your product by selecting the right category"
                              )}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="images" className="mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-sm bg-card/50 dark:bg-card/20">
                    <CardHeader className="pb-4 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        Product Images
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                      <FormField
                        control={form.control}
                        name="images"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base">Images (Max 5)</FormLabel>
                            <div
                              className={`relative border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors ${
                                isDragOver
                                  ? "border-primary bg-primary/5"
                                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
                              }`}
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                            >
                              <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                multiple
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => handleImageUpload(e.target.files)}
                                disabled={imagePreviews.length >= 5 || isUploadingImages}
                              />
                              <div className="space-y-3 sm:space-y-4">
                                <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-full flex items-center justify-center">
                                  {isUploadingImages ? (
                                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground animate-spin" />
                                  ) : (
                                    <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {isUploadingImages
                                      ? "Uploading images..."
                                      : imagePreviews.length >= 5
                                        ? "Maximum images reached"
                                        : "Drop images here or click to upload"}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB each</p>
                                </div>
                              </div>
                            </div>
                            {imagePreviews.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                {imagePreviews.map((preview, index) => (
                                  <motion.div
                                    key={`image-${index}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                                  >
                                    <img
                                      src={preview || "/placeholder.svg"}
                                      alt={`Product image ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => removeImage(index)}
                                      >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </Button>
                                    </div>
                                    {index === 0 && (
                                      <Badge className="absolute top-1 left-1 sm:top-2 sm:left-2 text-xs">Main</Badge>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            )}
                            <FormDescription className="text-xs sm:text-sm">
                              Upload high-quality images of your product. The first image will be the main product
                              image.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-sm bg-card/50 dark:bg-card/20">
                    <CardHeader className="pb-4 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                        Inventory Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                      {watchedHasVariants ? (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Palette className="h-5 w-5 text-primary mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-foreground mb-1">Variants Enabled</p>
                              <p className="text-muted-foreground">
                                Inventory is managed per variant. Go to the Variants tab to set quantities for each
                                color/size combination.
                              </p>
                              <p className="text-primary font-medium mt-2">
                                Total inventory:{" "}
                                {watchedVariants?.reduce(
                                  (total, v) => total + v.sizes.reduce((st, s) => st + s.quantity, 0),
                                  0
                                ) || 0}{" "}
                                items
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <FormField
                          control={form.control}
                          name="inventoryQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base">Stock Quantity *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  className="bg-background text-sm sm:text-base"
                                  {...field}
                                  value={field.value ?? 0}
                                  onChange={(e) => {
                                    const value = e.target.value === "" ? 0 : Number(e.target.value)
                                    field.onChange(value)
                                  }}
                                />
                              </FormControl>
                              <FormDescription className="text-xs sm:text-sm">
                                Number of items available for sale
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs sm:text-sm">
                            <p className="font-medium text-blue-900 dark:text-blue-100">Inventory Tracking</p>
                            <p className="text-blue-700 dark:text-blue-300 mt-1">
                              Your inventory will be automatically updated when customers make purchases. You'll receive
                              notifications when stock runs low.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Variants Tab */}
              <TabsContent value="variants" className="mt-4 sm:mt-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-0 shadow-sm bg-card/50 dark:bg-card/20">
                    <CardHeader className="pb-4 sm:pb-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                          Color & Size Variants
                        </CardTitle>
                        {supportsVariants && (
                          <FormField
                            control={form.control}
                            name="hasVariants"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormLabel className="text-sm font-normal">Enable variants</FormLabel>
                                <FormControl>
                                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                      {supportsVariants ? (
                        watchedHasVariants ? (
                          <ProductVariantsEditor
                            variants={(watchedVariants as ProductVariant[]) || []}
                            onChange={(newVariants) => {
                              form.setValue("variants", newVariants, { shouldDirty: true })
                            }}
                            category={watchedCategory}
                          />
                        ) : (
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-12 text-center bg-muted/20">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                              <Palette className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Variants Disabled</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                              Enable variants to add color and size options to your product
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => form.setValue("hasVariants", true)}
                              className="bg-transparent"
                            >
                              <Palette className="w-4 h-4 mr-2" />
                              Enable Variants
                            </Button>
                          </div>
                        )
                      ) : (
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-12 text-center bg-muted/20">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <Palette className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">Variants Not Available</h3>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto">
                            Color and size variants are only available for clothing, fashion, and related categories.
                            Update your product category to enable this feature.
                          </p>
                          <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {VARIANT_CATEGORIES.slice(0, 6).map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 flex-shrink-0">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base">Ready to create your product</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Review your information and publish when ready
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        className="w-full sm:w-auto order-2 sm:order-1 bg-transparent"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || isUploadingImages}
                        className="w-full sm:w-auto sm:min-w-[140px] order-1 sm:order-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Create Product
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </form>
        </Form>
      </div>
    </div>
  )
}
