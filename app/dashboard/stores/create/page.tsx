"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, Store, Building, ImageIcon, Upload, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { slugify } from "@/lib/utils"
import { mockStores } from "@/lib/mock-data"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { FormSection } from "@/components/ui/form-section"

const storeFormSchema = z.object({
  name: z.string().min(3, {
    message: "Store name must be at least 3 characters.",
  }),
  slug: z
    .string()
    .min(3, {
      message: "Store slug must be at least 3 characters.",
    })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens.",
    }),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
})

type StoreFormValues = z.infer<typeof storeFormSchema>

export default function CreateStorePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  // Initialize form with default values
  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logo_url: "",
      banner_url: "",
    },
  })

  // Generate slug from name
  form.watch((value, { name }) => {
    if (name === "name" && value.name && !form.getValues("slug")) {
      const generatedSlug = slugify(value.name)
      form.setValue("slug", generatedSlug)
    }
  })

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setBannerPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function onSubmit(data: StoreFormValues) {
    setIsSubmitting(true)

    try {
      // In a real app, we would save to Supabase here
      console.log("Store data:", data)

      // Create a new store with mock data
      const newStore = {
        id: `store-${Date.now()}`,
        user_id: "user-1",
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        logo_url: logoPreview || null,
        banner_url: bannerPreview || null,
        theme: null,
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (typeof window !== "undefined") {
        // Add the new store to local storage
        const stores = JSON.parse(localStorage.getItem("stores") || JSON.stringify(mockStores))
        stores.push(newStore)
        localStorage.setItem("stores", JSON.stringify(stores))

        // Save to local storage for now
        localStorage.setItem("storeData", JSON.stringify(data))
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Store created",
        description: "Your store has been created successfully.",
      })

      // Redirect to store builder
      router.push("/store-builder")
    } catch (error) {
      console.error("Error creating store:", error)

      toast({
        title: "Error creating store",
        description: "There was an error creating your store. Please try again.",
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
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Create a New Store</h1>
            <p className="text-muted-foreground">Set up your online store in minutes</p>
          </div>
        </div>
      </AnimatedContainer>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <AnimatedContainer animation="slideUp" delay={0.1}>
            <FormSection title="Store Information" description="Basic details about your store" icon={Building}>
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome Store" {...field} />
                      </FormControl>
                      <FormDescription>This is the name that customers will see.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store URL</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <div className="flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                            shopbuilder.com/stores/
                          </div>
                          <Input className="rounded-l-none" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>This is the URL where customers can find your store.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell customers what your store is all about..."
                          className="resize-none min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>A brief description of your store and what you sell.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
          </AnimatedContainer>

          <AnimatedContainer animation="slideUp" delay={0.2}>
            <FormSection title="Store Branding" description="Upload your store logo and banner" icon={ImageIcon}>
              <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Logo</FormLabel>
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border bg-muted">
                          {logoPreview ? (
                            <img
                              src={logoPreview || "/placeholder.svg"}
                              alt="Logo preview"
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <Store className="h-10 w-10 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              type="button"
                              className="w-full"
                              onClick={() => document.getElementById("logo-upload")?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Logo
                            </Button>
                            <input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoUpload}
                            />
                            <FormDescription>Recommended: Square image, at least 200x200px</FormDescription>
                          </div>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="banner_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Banner</FormLabel>
                      <div className="flex flex-col gap-4">
                        <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg border bg-muted">
                          {bannerPreview ? (
                            <img
                              src={bannerPreview || "/placeholder.svg"}
                              alt="Banner preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            type="button"
                            className="w-full"
                            onClick={() => document.getElementById("banner-upload")?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Banner
                          </Button>
                          <input
                            id="banner-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleBannerUpload}
                          />
                          <FormDescription>Recommended: 1200x400px image</FormDescription>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </FormSection>
          </AnimatedContainer>

          <AnimatedContainer animation="fadeIn" delay={0.3}>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Your store is almost ready!</span>
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Store className="mr-2 h-4 w-4" />
                        Create Store
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </form>
      </Form>
    </div>
  )
}
