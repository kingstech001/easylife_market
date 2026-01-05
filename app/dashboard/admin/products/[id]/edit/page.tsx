"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const productFormSchema = z.object({
  name: z.string().min(3, {
    message: "Product name must be at least 3 characters.",
  }),
  description: z.string().optional(),
  price: z.number().positive({
    message: "Price must be a positive number.",
  }),
  compare_at_price: z.number().positive().optional().or(z.literal(undefined)),
  category_id: z.string().optional(),
  inventory_quantity: z.number().int().nonnegative(),
  is_published: z.boolean(),
  images: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        alt_text: z.string().optional(),
      })
    )
    .optional(),
})

type ProductFormValues = z.infer<typeof productFormSchema>

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loadingProduct, setLoadingProduct] = useState(true)

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
      images: [],
    },
  })

  // Fetch product + categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingProduct(true)

        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/products/${params.id}`),
          fetch(`/api/categories`),
        ])

        if (!productRes.ok) throw new Error("Failed to fetch product")
        if (!categoriesRes.ok) throw new Error("Failed to fetch categories")

        const productData = await productRes.json()
        const categoriesData = await categoriesRes.json()

        setCategories(categoriesData)

        form.reset({
          name: productData.name,
          description: productData.description || "",
          price: Number(productData.price),
          compare_at_price: productData.compare_at_price ? Number(productData.compare_at_price) : undefined,
          category_id: productData.category_id || "",
          inventory_quantity: Number(productData.inventory_quantity),
          is_published: productData.is_published,
          images: productData.images || [],
        })
      } catch (error) {
        console.error(error)
        toast.error("Failed to load product details")
      } finally {
        setLoadingProduct(false)
      }
    }

    fetchData()
  }, [params.id, form])

  const addPlaceholderImage = () => {
    const currentImages = form.getValues("images") || []
    form.setValue("images", [
      ...currentImages,
      {
        id: `new-${Date.now()}`,
        url: `/placeholder.svg?height=300&width=300&text=Product+Image+${currentImages.length + 1}`,
        alt_text: `Product image ${currentImages.length + 1}`,
      },
    ])
  }

  const removeImage = (imageId: string) => {
    const currentImages = form.getValues("images") || []
    const updatedImages = currentImages.filter((image) => image.id !== imageId)
    form.setValue("images", updatedImages)
  }

  async function onSubmit(data: ProductFormValues) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Update failed")

      toast.success("Product updated successfully")
      router.push("/dashboard/products")
    } catch (error) {
      console.error(error)
      toast.error("There was an error updating your product")
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin mr-2 h-6 w-6" />
        Loading product...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Edit Product</h2>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
          {isLoading ? (
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Product Details</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Basic information about your product</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
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
                          <Textarea placeholder="Product description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="compare_at_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compare at Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_published"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-3">
                        <FormLabel>Published</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                  <CardDescription>Manage your product images</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" onClick={addPlaceholderImage} className="mb-4">
                    Add Image
                  </Button>
                  <div className="grid grid-cols-3 gap-4">
                    {form.watch("images")?.map((img) => (
                      <div key={img.id} className="relative">
                        <img src={img.url} alt={img.alt_text || ""} className="w-full h-auto" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => removeImage(img.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory</CardTitle>
                  <CardDescription>Manage your product inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="inventory_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}