"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
  DollarSign,
  Tag,
  Box,
  Sparkles,
  LucideImage,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Image from "next/image" // Import next/image

const productSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  name: z.string().min(3, "Product name must be at least 3 characters."),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number."),
  compareAtPrice: z.coerce.number().positive().optional(),
  category: z.string().optional(),
  inventoryQuantity: z.coerce.number().int().nonnegative("Inventory must be a non-negative integer."),
  images: z
    .array(
      z.object({
        url: z.string().url("Invalid image URL."),
        altText: z.string().optional(),
      }),
    )
    .optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function StoreBuilderPage() {
  const router = useRouter()
  const [store, setStore] = useState<any>(null)
  const [products, setProducts] = useState<ProductFormValues[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [editingProduct, setEditingProduct] = useState<ProductFormValues | null>(null)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      inventoryQuantity: 0,
      images: [],
    },
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch store data
        console.log("Fetching store data...")
        const storeRes = await fetch("/api/dashboard/seller/store")

        if (!storeRes.ok) {
          const errorData = await storeRes.json().catch(() => ({ message: "Unknown error" }))
          throw new Error(`Failed to fetch store: ${errorData.message || storeRes.statusText}`)
        }
        const { store } = await storeRes.json()
        console.log("Store data received:", store)
        setStore(store)

        // Fetch product data
        console.log("Fetching product data...")
        const productRes = await fetch("/api/dashboard/seller/products")
        if (!productRes.ok) {
          const errorData = await productRes.json().catch(() => ({ message: "Unknown error" }))
          throw new Error(`Failed to fetch products: ${errorData.message || productRes.statusText}`)
        }
        const { products } = await productRes.json()
        console.log("Products data received:", products)
        setProducts(products || [])
        console.log("Data fetching completed successfully.")
      } catch (error: any) {
        console.error("Error during data fetch:", error)
        if (error.name === "AbortError") {
          toast.error("Request timed out. Please check your network or server response time.")
        } else {
          toast.error(error.message || "Failed to fetch store or products. Please try again.")
        }
      } finally {
        console.log("Setting loading to false.")
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleEdit = (p: ProductFormValues) => {
    setEditingProduct(p)
    form.reset(p)
  }

  const handleDelete = async (productId: string) => {
    setIsSubmitting(true) // Indicate deletion is in progress
    try {
      const res = await fetch(`/api/dashboard/seller/products/${productId}`, { method: "DELETE" })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }))
        throw new Error(`Failed to delete product: ${errorData.message || res.statusText}`)
      }
      setProducts(products.filter((p) => (p.id || p._id) !== productId))
      toast.success("Product deleted successfully")
      // If the deleted product was being edited, clear the form
      if ((editingProduct?.id || editingProduct?._id) === productId) {
        setEditingProduct(null)
        form.reset()
        setActiveTab("details")
      }
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error(error.message || "Failed to delete product")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (data: ProductFormValues) => {
    if (!store?._id) {
      toast.error("No store found. Please ensure your store is set up.")
      return
    }
    setIsSubmitting(true)
    try {
      const payload = { ...data, storeId: store._id }
      let resultProduct: ProductFormValues // Declare resultProduct with its type

      const editingId = editingProduct?.id || editingProduct?._id
      if (editingId) {
        const res = await fetch(`/api/dashboard/seller/products/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: "Unknown error" }))
          throw new Error(`Failed to update product: ${errorData.message || res.statusText}`)
        }
        const { data: product } = await res.json() // Corrected: Destructure 'data' as 'product'
        resultProduct = product
        setProducts((prev) =>
          prev.map((p) => ((p.id || p._id) === (resultProduct.id || resultProduct._id) ? resultProduct : p)),
        )
        toast.success("Product updated successfully")
      } else {
        const res = await fetch("/api/dashboard/seller/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: "Unknown error" }))
          throw new Error(`Failed to add product: ${errorData.message || res.statusText}`)
        }
        const { product } = await res.json() // Correct: Destructure 'product'
        resultProduct = product
        setProducts((prev) => [...prev, resultProduct])
        toast.success("Product added successfully")
      }
      setEditingProduct(null)
      form.reset()
      setActiveTab("details")
    } catch (error: any) {
      console.error("Save/Update error:", error)
      toast.error(error.message || "Failed to save product")
    } finally {
      setIsSubmitting(false)
    }
  }

  const publishStore = async () => {
    if (!store?._id) {
      toast.error("No store found to publish.")
      return
    }

    setIsSubmitting(true)
    console.log("Attempting to publish store with ID:", store._id)

    try {
      const res = await fetch("/api/dashboard/seller/store/publish", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: store._id }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || `Failed to publish store: ${res.statusText}`)
      }

      toast.success("Store published successfully!")

      // Redirect based on role returned by backend
      if (data.role === "admin") {
        router.push("/dashboard/admin")
      } else {
        router.push("/dashboard/seller/store")
      }

    } catch (error: any) {
      console.error("Publish error:", error)
      toast.error(error.message || "Failed to publish store")
    } finally {
      setIsSubmitting(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Loading your store</h3>
            <p className="text-muted-foreground">Setting up your workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner Section */}
      <div
        className="relative w-full h-64 md:h-80 bg-cover bg-center"
        style={{
          backgroundImage: `url(${store?.banner_url || "/placeholder.svg?height=320&width=1200&text=Store+Banner"})`,
        }}
      >
        {/* Modern Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

        {/* Navigation */}
        <div className="absolute top-6 left-0 right-0 px-4 md:px-8 flex justify-between items-center z-20">
          <Button
            variant="secondary"
            onClick={() => router.push("/dashboard/seller")}
            className="backdrop-blur-md bg-background/90 hover:bg-background shadow-lg border-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <Button
            onClick={publishStore}
            disabled={isSubmitting || !products.length}
            className="shadow-lg bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
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

      {/* Store Info Section (between banner and main content) */}
      <div className="relative z-30 -mt-24 md:-mt-32 container mx-auto px-4">
        <div className="mt-16">
          <div className="items-start md:items-end gap-6">
            {store?.logo_url ? (
              <div className="relative block flex-shrink-0 max-w-28">
                <Image
                  src={store.logo_url || "/placeholder.svg"}
                  alt="Store Logo"
                  width={112}
                  height={112}
                  className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-xl"
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-foreground rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            ) : (
              <div className="w-28 h-28 rounded-3xl bg-muted border-4 border-white shadow-xl flex items-center justify-center flex-shrink-0">
                <Store className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0 pt-4 md:pt-0">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight text-foreground">
                {store?.name || "Your Store"}
              </h1>
              <p className="text-base md:text-xl text-muted-foreground mt-2">
                {store?.description || "Add a description to tell customers about your store"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Products Sidebar */}
          <div className="flex-1">
            <Card className="shadow-xl border bg-card/80 backdrop-blur-sm sticky top-8">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-muted">
                      <Package className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <span>Products</span>
                      <Badge variant="secondary" className="ml-3">
                        {products.length}
                      </Badge>
                    </div>
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingProduct(null)
                      form.reset()
                      setActiveTab("details")
                    }}
                    className="bg-primary hover:bg-primary/90 shadow-lg"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto custom-scrollbar">
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
                      <p className="text-sm">Add your first product to get started</p>
                    </motion.div>
                  ) : (
                    products.map((p, index) => {
                      const uniqueKey = p.id || p._id || `product-${index}`
                      const productId = p.id || p._id
                      const editingId = editingProduct?.id || editingProduct?._id
                      const isEditing = editingId === productId
                      return (
                        <motion.div
                          key={uniqueKey}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all duration-300 hover:shadow-lg border group ${isEditing
                                ? "border-primary bg-primary/5 shadow-lg"
                                : "border-border hover:border-border bg-background"
                              }`}
                            onClick={() => handleEdit(p)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-3">
                                    <h3 className="font-semibold truncate">{p.name}</h3>
                                    {isEditing && (
                                      <Badge className="bg-muted text-foreground border-border">
                                        <Edit3 className="w-3 h-3 mr-1" />
                                        Editing
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1 font-medium">
                                      <DollarSign className="w-3 h-3 text-foreground" />₦{p.price.toFixed(2)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Box className="w-3 h-3 text-foreground" />
                                      {p.inventoryQuantity} in stock
                                    </span>
                                  </div>
                                  {p.category && (
                                    <Badge variant="outline" className="text-xs">
                                      <Tag className="w-2 h-2 mr-1" />
                                      {p.category}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (productId) handleDelete(productId)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Product Form */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={editingProduct?.id || editingProduct?._id || "new"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-xl border bg-card/90 backdrop-blur-sm">
                  <CardHeader className="pb-6 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-muted">
                          {editingProduct ? (
                            <Edit3 className="w-6 h-6 text-foreground" />
                          ) : (
                            <Plus className="w-6 h-6 text-foreground" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-2xl">
                            {editingProduct ? "Edit Product" : "Add New Product"}
                          </CardTitle>
                          <p className="text-muted-foreground mt-1">
                            {editingProduct ? "Update your product details" : "Create a new product for your store"}
                          </p>
                        </div>
                      </div>
                      {editingProduct && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProduct(null)
                            form.reset()
                            setActiveTab("details")
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                      <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-xl h-12">
                        <TabsTrigger
                          value="details"
                          className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Details
                        </TabsTrigger>
                        <TabsTrigger
                          value="images"
                          className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Images
                        </TabsTrigger>
                        <TabsTrigger
                          value="inventory"
                          className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
                        >
                          <Box className="w-4 h-4 mr-2" />
                          Inventory
                        </TabsTrigger>
                      </TabsList>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                          {/* Details Tab */}
                          <TabsContent value="details" className="space-y-8 mt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="md:col-span-2">
                                <FormField
                                  control={form.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-lg font-semibold">Product Name *</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter a compelling product name"
                                          className="h-14 text-base"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-lg font-semibold">Price (₦) *</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground" />
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          placeholder="0.00"
                                          className="pl-12 h-14 text-base"
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
                                    <FormLabel className="text-lg font-semibold">Category</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground" />
                                        <Input
                                          placeholder="e.g., Electronics, Clothing, Books"
                                          className="pl-12 h-14 text-base"
                                          {...field}
                                        />
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="md:col-span-2">
                                <FormField
                                  control={form.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-lg font-semibold">Description</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Describe your product in detail. What makes it special?"
                                          rows={5}
                                          className="text-base resize-none"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </TabsContent>

                          {/* Images Tab */}
                          <TabsContent value="images" className="space-y-8 mt-8">
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-xl font-semibold">Product Images</h3>
                                  <p className="text-muted-foreground mt-1">
                                    Add high-quality images to showcase your product
                                  </p>
                                </div>
                                <label
                                  htmlFor="upload"
                                  className="inline-flex items-center px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-xl cursor-pointer hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
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
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast.error("Image must be less than 5MB")
                                      return
                                    }
                                    const formData = new FormData()
                                    formData.append("file", file)
                                    setIsSubmitting(true)
                                    try {
                                      const res = await fetch("/api/upload", {
                                        method: "POST",
                                        body: formData,
                                      })
                                      if (!res.ok) throw new Error("Failed to upload")
                                      const { secure_url } = await res.json()
                                      const existingImages = form.getValues("images") ?? []
                                      form.setValue("images", [
                                        ...existingImages,
                                        {
                                          url: secure_url,
                                          altText: `${form.getValues("name") || "Product"} image ${existingImages.length + 1}`,
                                        },
                                      ])
                                      toast.success("Image uploaded successfully")
                                    } catch (err) {
                                      console.error(err)
                                      toast.error("Image upload failed")
                                    } finally {
                                      setIsSubmitting(false)
                                    }
                                  }}
                                />
                              </div>
                              <Separator />
                              {/* Image Gallery */}
                              {(form.getValues("images") ?? []).length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                  {(form.getValues("images") ?? []).map((img, idx) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: idx * 0.1 }}
                                      className="relative group"
                                    >
                                      <div className="aspect-square rounded-2xl overflow-hidden border-2 border-border group-hover:border-primary transition-colors shadow-lg group-hover:shadow-xl">
                                        <Image
                                          src={img.url || "/placeholder.svg"}
                                          alt={img.altText || `Product image ${idx + 1}`}
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
                                          const currentImages = form.getValues("images") ?? []
                                          form.setValue(
                                            "images",
                                            currentImages.filter((_, i) => i !== idx),
                                          )
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                      {idx === 0 && (
                                        <Badge className="absolute bottom-3 left-3 bg-primary text-primary-foreground border-0 shadow-lg">
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
                                  <h3 className="text-lg font-semibold mb-2">No images yet</h3>
                                  <p className="text-muted-foreground">
                                    Upload your first product image to get started
                                  </p>
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          {/* Inventory Tab */}
                          <TabsContent value="inventory" className="space-y-8 mt-8">
                            <div className="max-w-md">
                              <FormField
                                control={form.control}
                                name="inventoryQuantity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-lg font-semibold">Stock Quantity *</FormLabel>
                                    <FormControl>
                                      <div className="relative">
                                        <Box className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground" />
                                        <Input
                                          type="number"
                                          min="0"
                                          placeholder="0"
                                          className="pl-12 h-14 text-base"
                                          {...field}
                                        />
                                      </div>
                                    </FormControl>
                                    <p className="text-muted-foreground mt-2">How many units do you have in stock?</p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </TabsContent>

                          {/* Action Buttons */}
                          <div className="flex justify-end pt-8 border-t">
                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl px-8 h-14 text-base font-semibold"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                  {editingProduct ? "Updating..." : "Saving..."}
                                </>
                              ) : (
                                <>
                                  <Save className="h-5 w-5 mr-3" />
                                  {editingProduct ? "Update Product" : "Save Product"}
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
