"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  ArrowLeft,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react"

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

import { mockProducts, mockCategories } from "@/lib/mock-data"

const productFormSchema = z.object({
  name: z.string().min(3, {
    message: "Product name must be at least 3 characters.",
  }),
  description: z.string().optional(),
  price: z.coerce.number().positive({
    message: "Price must be a positive number.",
  }),
  compare_at_price: z.coerce.number().positive().optional(),
  category_id: z.string().optional(),
  inventory_quantity: z.coerce.number().int().nonnegative(),
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

  const product = mockProducts.find((product) => product.id === params.id)
  const categories = mockCategories

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

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        compare_at_price: product.compare_at_price || undefined,
        category_id: product.category_id || "",
        inventory_quantity: product.inventory_quantity,
        is_published: product.is_published,
        images: product.images,
      })
    }
  }, [product, form])

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
      console.log("Updating product:", data)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Product updated successfully")
      router.push("/dashboard/products")
    } catch (error) {
      console.error("Error updating product:", error)
      toast.error("There was an error updating your product. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Product not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Basic information about your product</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Fields */}
                  {/* Name */}
                  {/* Description */}
                  {/* Price and Compare Price */}
                  {/* Category */}
                  {/* Visibility Switch */}
                  {/* Reuse your form fields here (trimmed to save space) */}
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
                  {/* Add Image Button */}
                  {/* Image List */}
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
                  {/* Inventory Quantity Field */}
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}
