"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, ImageIcon, Loader2, Package, Tag, Layers, Upload, Trash2, Save, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

type Product = {
  _id: string
  name: string
  description?: string
  price: number
  compareAtPrice?: number
  category?: string
  inventoryQuantity: number
  images?: { url: string; altText?: string }[]
  createdAt: string
  updatedAt: string
}

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
      }),
    )
    .optional(),
})

type ProductFormValues = z.infer<typeof productFormSchema>

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  // Debug logging
  console.log("🔍 Params:", params)
  console.log("🔍 ID:", id)
  console.log("🔍 ID type:", typeof id)

  const [isLoading, setIsLoading] = useState(true)
  const [productError, setProductError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

  // Debug: Log active tab changes
  useEffect(() => {
    console.log("🔄 Active tab changed to:", activeTab)
  }, [activeTab])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      compareAtPrice: undefined,
      category: "",
      inventoryQuantity: 0,
      images: [],
    },
  })

  const [isDragOver, setIsDragOver] = useState(false)

  const fetchProduct = useCallback(async () => {
    if (!id) {
      console.error("❌ No ID available for fetching product")
      setProductError("Product ID is missing")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setProductError(null)

    const apiUrl = `/api/dashboard/seller/products/${id}`
    console.log("📡 Fetching from:", apiUrl)

    try {
      const response = await fetch(apiUrl)

      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        let errorMessage = "Failed to fetch product details."

        try {
          const errorData = await response.json()
          console.error("❌ Error data:", errorData)
          errorMessage = errorData.message || errorMessage
        } catch (jsonError) {
          try {
            const errorText = await response.text()
            console.error("❌ Error text:", errorText)
            if (errorText) {
              errorMessage = `Server error: ${errorText.substring(0, Math.min(errorText.length, 100))}...`
            }
          } catch {}
        }

        throw new Error(errorMessage)
      }

      const data: { product: Product } = await response.json()
      console.log("✅ Product data received:", data)
      const product = data.product

      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        compareAtPrice: product.compareAtPrice || undefined,
        category: product.category || "",
        inventoryQuantity: product.inventoryQuantity,
        images: product.images || [],
      })

      if (product.images) {
        setImagePreviews(product.images.map((img) => img.url))
      }
    } catch (err: any) {
      console.error("❌ Fetch error:", err)
      setProductError(err.message || "An unexpected error occurred.")
      toast.error("Failed to load product", {
        description: err.message || "Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [id, form])

  useEffect(() => {
    console.log("🔄 useEffect triggered, ID:", id)
    if (id) {
      console.log("✅ ID exists, fetching product...")
      fetchProduct()
    } else {
      console.error("❌ ID is undefined in useEffect")
      setProductError("Product ID is missing")
      setIsLoading(false)
    }
  }, [fetchProduct, id])

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newFilesArray = Array.from(files).slice(0, 5 - imagePreviews.length)
    if (newFilesArray.length === 0) {
      toast.info("Maximum 5 images allowed.", {
        description: "Please remove existing images to upload more.",
      })
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
          } catch {
            try {
              const errorText = await response.text()
              errorMessage = `Server error: ${errorText.substring(0, Math.min(errorText.length, 100))}...`
            } catch {}
          }

          throw new Error(errorMessage)
        }

        const result = await response.json()
        uploadedImageUrls.push({
          url: result.secure_url,
          altText: `${form.getValues("name") || "Product"} image ${
            imagePreviews.length + uploadedImageUrls.length + 1
          }`,
        })

        setImagePreviews((prev) => [...prev, result.secure_url])
        toast.success(`Image "${file.name}" uploaded.`)
      } catch (error: any) {
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

  const removeImage = (indexToRemove: number) => {
    const updatedPreviews = imagePreviews.filter((_, i) => i !== indexToRemove)
    const updatedImages = (form.getValues("images") || []).filter((_, i) => i !== indexToRemove)

    setImagePreviews(updatedPreviews)
    form.setValue("images", updatedImages)
    toast.info("Image removed.")
  }

  async function onSubmit(data: ProductFormValues) {
    if (!id) {
      toast.error("Product ID is missing", {
        description: "Cannot update product without ID.",
      })
      return
    }

    setIsSubmitting(true)
    const apiUrl = `/api/dashboard/seller/products/${id}`
    console.log("📡 Updating product at:", apiUrl)

    try {
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      console.log("📡 Update response status:", response.status)

      if (!response.ok) {
        let errorMessage = "Failed to update product."

        try {
          const errorData = await response.json()
          console.error("❌ Update error data:", errorData)
          errorMessage = errorData.message || errorMessage
        } catch {
          try {
            const errorText = await response.text()
            console.error("❌ Update error text:", errorText)
            errorMessage = `Server error: ${errorText.substring(0, Math.min(errorText.length, 100))}...`
          } catch {}
        }

        throw new Error(errorMessage)
      }

      console.log("✅ Product updated successfully")
      toast.success("Product updated successfully!", {
        description: "Your product changes have been saved.",
      })
      router.push("/dashboard/seller/products")
    } catch (error: any) {
      console.error("❌ Update error:", error)
      toast.error("Failed to update product", {
        description: error.message || "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-4 text-lg text-muted-foreground">Loading product...</span>
      </div>
    )
  }

  if (productError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-destructive">
        <p className="text-lg">Error loading product: {productError}</p>
        <p className="text-sm text-muted-foreground mt-2">Product ID: {id || "undefined"}</p>
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
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 flex-shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Product</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Modify details for {form.getValues("name") || "this product"}
              </p>
            </div>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting || isUploadingImages}
              className="ml-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12 bg-muted/50 dark:bg-muted/20 p-1">
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Tag className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline sm:hidden">Details</span>
                  <span className="hidden sm:inline">Product Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="images"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3"
                >
                  <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Images</span>
                </TabsTrigger>
                <TabsTrigger
                  value="inventory"
                  className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline sm:hidden">Stock</span>
                  <span className="hidden sm:inline">Inventory</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 sm:mt-6">
                <div>
                  <Card className="border-0 shadow-sm bg-card/50 dark:bg-card/20">
                    <CardHeader className="pb-4 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Tag className="h-4 w-4 sm:h-5 sm:w-5" />
                        Product Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter product name" {...field} />
                            </FormControl>
                            <FormDescription>This is the name that will be displayed to customers.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your product..."
                                className="min-h-[120px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>Provide a detailed description of your product.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormDescription>Regular selling price</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="compareAtPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Compare at Price (Optional)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormDescription>Original price (for discounts)</FormDescription>
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
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Electronics, Clothing" {...field} />
                            </FormControl>
                            <FormDescription>Product category for organization</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="inventory" className="mt-4 sm:mt-6">
                <div>
                  <Card className="border-0 shadow-sm bg-card/50 dark:bg-card/20">
                    <CardHeader className="pb-4 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
                        Inventory Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                      <FormField
                        control={form.control}
                        name="inventoryQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormDescription>Number of items available for sale</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4">
                        <div className="flex gap-3">
                          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Inventory Tips</p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Keep your stock levels up to date to avoid overselling. Consider setting a low stock alert
                              threshold.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="images" className="mt-4 sm:mt-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div
                    className="relative border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors"
                    onMouseEnter={() => setIsDragOver(true)}
                    onMouseLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input
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
                          className="relative group aspect-square rounded-lg overflow-hidden border bg-muted shadow-sm"
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
                </motion.div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  )
}
