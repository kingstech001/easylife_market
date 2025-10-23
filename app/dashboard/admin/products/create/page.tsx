"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ImageIcon, Loader2, ShoppingBag, Package, Tag, Layers, Check } from "lucide-react"

import { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

const productFormSchema = z.object({
  name: z.string().min(3, { message: "Product name must be at least 3 characters." }),
  description: z.string().optional(),
  price: z.coerce.number().positive({ message: "Price must be a positive number." }),
  compare_at_price: z.coerce.number().positive().optional(),
  category_id: z.string().optional(),
  inventory_quantity: z.coerce.number().int().nonnegative(),
  is_published: z.boolean(),
  store_id: z.string(),
  images: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        alt_text: z.string().optional(),
      }),
    )
    .optional(),
})

type ProductFormValues = z.infer<typeof productFormSchema>

export default function CreateProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [stores, setStores] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)

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
    let mounted = true
    async function loadMeta() {
      setLoadingMeta(true)
      try {
        const [storesRes, categoriesRes] = await Promise.all([fetch("/api/stores"), fetch("/api/categories")])

        if (!storesRes.ok) throw new Error("Failed to load stores")
        if (!categoriesRes.ok) throw new Error("Failed to load categories")

        const storesJson = await storesRes.json()
        const categoriesJson = await categoriesRes.json()

        const storesArr = storesJson.stores ?? storesJson
        const categoriesArr = categoriesJson.categories ?? categoriesJson

        if (!mounted) return
        setStores(storesArr)
        setCategories(categoriesArr)

        const currentStoreId = form.getValues("store_id")
        if ((!currentStoreId || currentStoreId === "") && storesArr?.length) {
          form.setValue("store_id", storesArr[0]._id ?? storesArr[0].id ?? storesArr[0])
        }
      } catch (err) {
        console.error("Failed to load stores/categories:", err)
        toast("Could not load stores or categories. Try again later.")
      } finally {
        if (mounted) setLoadingMeta(false)
      }
    }
    loadMeta()
    return () => {
      mounted = false
    }
  }, [form, toast])

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    setIsSubmitting(true)
    try {
      const payload = {
        store_id: data.store_id,
        category_id: data.category_id === "no-category" ? null : data.category_id || null,
        name: data.name,
        description: data.description || null,
        price: Number(data.price),
        compare_at_price: data.compare_at_price ?? null,
        inventory_quantity: Number(data.inventory_quantity),
        is_published: data.is_published,
      }

      let res: Response

      if (imageFiles.length > 0) {
        const formData = new FormData()
        formData.append("payload", JSON.stringify(payload))
        imageFiles.forEach((file) => {
          formData.append("images", file)
        })
        res = await fetch("/api/products", { method: "POST", body: formData })
      } else {
        res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson?.error || "Failed to create product")
      }

      toast("Your product has been created successfully.")
      router.push("/admin/products")
    } catch (error: any) {
      console.error("Error creating product:", error)
      toast("There was an error creating your product.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="w-full grid grid-cols-3 h-auto p-1">
          <TabsTrigger value="details" className="flex items-center gap-2 py-3">
            <Tag className="h-4 w-4" />
            <span>Details</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2 py-3">
            <ImageIcon className="h-4 w-4" />
            <span>Images</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2 py-3">
            <Layers className="h-4 w-4" />
            <span>Inventory</span>
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TabsContent value="details" className="space-y-6 mt-0">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Tag className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">Basic Information</h3>
                      <p className="text-sm text-muted-foreground">Enter the details of your product</p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="store_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingMeta ? "Loading stores..." : "Select a store"} />
                            </SelectTrigger>
                            <SelectContent>
                              {stores.map((store: any) => (
                                <SelectItem key={store._id ?? store.id ?? store} value={store._id ?? store.id ?? store}>
                                  {store.name ?? store.title ?? String(store)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
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
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
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
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
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
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value || "no-category"}>
                            <SelectTrigger>
                              <SelectValue placeholder={loadingMeta ? "Loading..." : "Select a category"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-category">None</SelectItem>
                              {categories.map((cat: any) => (
                                <SelectItem key={cat._id ?? cat.id ?? cat} value={cat._id ?? cat.id ?? cat}>
                                  {cat.name ?? cat.title ?? String(cat)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* ... existing code for other tabs ... */}

            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Your product is ready to be created</span>
                  </div>
                  <Button type="submit" disabled={isSubmitting || loadingMeta} className="w-full sm:w-auto">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="mr-2 h-4 w-4" /> Create Product
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}
