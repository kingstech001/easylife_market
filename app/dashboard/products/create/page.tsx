"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { z } from "zod"
import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft, ImageIcon, Loader2, ShoppingBag, Package,
  Tag, Layers, Upload, Check, X, Info
} from "lucide-react"

import { Form } from "@/components/ui/form"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { mockCategories, mockProducts, mockStores } from "@/lib/mock-data"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { FormSection } from "@/components/ui/form-section"

const productFormSchema = z.object({
  name: z.string().min(3, {
    message: "Product name must be at least 3 characters.",
  }),
  description: z.string().optional(),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  compare_at_price: z.coerce.number().positive().optional(),
  category_id: z.string().optional(),
  inventory_quantity: z.coerce.number().int().nonnegative(),
  is_published: z.boolean(),
  store_id: z.string(),
  images: z.array(z.object({
    id: z.string(),
    url: z.string(),
    alt_text: z.string().optional(),
  })).optional(),
})

type ProductFormValues = z.infer<typeof productFormSchema>

export default function CreateProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [stores, setStores] = useState<any[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  useEffect(() => {
    const storedStores =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("stores") || JSON.stringify(mockStores))
        : mockStores
    setStores(storedStores)
  }, [])

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      compare_at_price: undefined,
      category_id: "",
      inventory_quantity: 0,
      is_published: false,
      store_id: "",
      images: [],
    },
  })

  useEffect(() => {
    if (stores.length > 0 && !form.getValues("store_id")) {
      form.setValue("store_id", stores[0].id)
    }
  }, [stores, form])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newFiles = Array.from(files)
      setImageFiles((prev) => [...prev, ...newFiles])

      const newPreviews: string[] = []

      newFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            newPreviews.push(e.target.result as string)

            if (newPreviews.length === newFiles.length) {
              setImagePreviews((prev) => [...prev, ...newPreviews])

              const currentImages = form.getValues("images") || []
              const newImages = newPreviews.map((preview, index) => ({
                id: `new-${Date.now()}-${index}`,
                url: preview,
                alt_text: `Product image ${currentImages.length + index + 1}`,
              }))

              form.setValue("images", [...currentImages, ...newImages])
            }
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    const updatedPreviews = [...imagePreviews]
    updatedPreviews.splice(index, 1)
    setImagePreviews(updatedPreviews)

    const updatedFiles = [...imageFiles]
    updatedFiles.splice(index, 1)
    setImageFiles(updatedFiles)

    const currentImages = form.getValues("images") || []
    const updatedImages = [...currentImages]
    updatedImages.splice(index, 1)
    form.setValue("images", updatedImages)
  }

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    setIsSubmitting(true)
    try {
      const newProduct = {
        id: `product-${Date.now()}`,
        store_id: data.store_id,
        category_id: data.category_id || null,
        name: data.name,
        description: data.description || null,
        price: data.price,
        compare_at_price: data.compare_at_price || null,
        inventory_quantity: data.inventory_quantity,
        is_published: data.is_published,
        images: data.images || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (typeof window !== "undefined") {
        const products = JSON.parse(localStorage.getItem("products") || JSON.stringify(mockProducts))
        products.push(newProduct)
        localStorage.setItem("products", JSON.stringify(products))
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Product created",
        description: "Your product has been created successfully.",
      })

      router.push("/dashboard/products")
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        title: "Error creating product",
        description: "There was an error creating your product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <AnimatedContainer animation="fadeIn" className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Add New Product</h1>
            <p className="text-muted-foreground">Create a new product for your store</p>
          </div>
        </div>
      </AnimatedContainer>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="w-full grid grid-cols-3 h-auto p-1">
          <TabsTrigger
            value="details"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
          >
            <Tag className="h-4 w-4" />
            <span>Details</span>
          </TabsTrigger>
          <TabsTrigger
            value="images"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
          >
            <ImageIcon className="h-4 w-4" />
            <span>Images</span>
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3"
          >
            <Layers className="h-4 w-4" />
            <span>Inventory</span>
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TabsContent value="details" className="space-y-6 mt-0">
              <AnimatedContainer animation="fadeIn">
                <FormSection title="Basic Information" description="Enter the details of your product" icon={Tag}>
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="store_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a store" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {stores.map((store: any) => (
                                <SelectItem key={store.id} value={store.id}>
                                  {store.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Select the store for this product.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Organic Cotton T-Shirt" {...field} />
                          </FormControl>
                          <FormDescription>This is the name that customers will see.</FormDescription>
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
                              className="resize-none min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>A detailed description of your product.</FormDescription>
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
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input className="pl-6" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="compare_at_price"
                        render={({ field: { value, onChange, ...field } }) => (
                          <FormItem>
                            <FormLabel>Compare-at Price</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  className="pl-6"
                                  {...field}
                                  value={value === undefined ? "" : value}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    onChange(val === "" ? undefined : Number(val))
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>Original price for showing a discount.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {mockCategories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Categorize your product for better organization.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_published"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Product Visibility</FormLabel>
                            <FormDescription>When enabled, your product will be visible to customers.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>
              </AnimatedContainer>
            </TabsContent>

            <TabsContent value="images" className="space-y-6 mt-0">
              <AnimatedContainer animation="fadeIn">
                <FormSection title="Product Images" description="Upload images of your product" icon={ImageIcon}>
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center">
                            <FormLabel>Images</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById("image-upload")?.click()}
                              className="flex items-center gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              Upload Images
                            </Button>
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                          </div>

                          <FormDescription>
                            Upload high-quality images of your product. You can add multiple images.
                          </FormDescription>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                            {(field.value || []).map((image, index) => (
                              <motion.div
                                key={image.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="relative aspect-square rounded-md overflow-hidden border group"
                              >
                                <img
                                  src={image.url || "/placeholder.svg"}
                                  alt={image.alt_text || "Product image"}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => removeImage(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </motion.div>
                            ))}

                            {(field.value || []).length === 0 && (
                              <div className="aspect-square border rounded-md flex flex-col items-center justify-center text-muted-foreground p-4 text-center col-span-full">
                                <ImageIcon className="h-8 w-8 mb-2" />
                                <p>No images added yet</p>
                                <p className="text-xs">Click "Upload Images" to add product images</p>
                              </div>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>
              </AnimatedContainer>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6 mt-0">
              <AnimatedContainer animation="fadeIn">
                <FormSection title="Inventory Management" description="Manage your product stock" icon={Layers}>
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="inventory_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inventory Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormDescription>Number of items in stock.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 flex items-start gap-2">
                      <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Inventory Tracking</p>
                        <p className="text-sm">
                          Your inventory will be automatically updated when customers make purchases.
                        </p>
                      </div>
                    </div>
                  </div>
                </FormSection>
              </AnimatedContainer>
            </TabsContent>

            <AnimatedContainer animation="fadeIn" delay={0.2}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-5 w-5 text-green-600" />
                      <span>Your product is ready to be created</span>
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
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
                </CardContent>
              </Card>
            </AnimatedContainer>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}
