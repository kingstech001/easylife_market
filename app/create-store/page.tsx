"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, StoreIcon, Building, ImageIcon, Upload, Check } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { slugify } from "@/lib/utils"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { FormSection } from "@/components/ui/form-section"

const storeFormSchema = z.object({
  name: z.string().min(3, { message: "Store name must be at least 3 characters." }),
  slug: z
    .string()
    .min(3)
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
  const [ownerId, setOwnerId] = useState<string | null>(null)

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

  // Auto-generate slug
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "name" && value.name && !form.formState.dirtyFields.slug) {
        form.setValue("slug", slugify(value.name), { shouldValidate: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Get user from JWT via API
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" })
        const data = await res.json()
        if (res.ok && data?.user?.id) {
          setOwnerId(data.user.id)
        } else {
          toast("User not authenticated. Please log in to create a store.")
          // Optionally redirect to login page
          // router.push("/login")
        }
      } catch (err) {
        toast("Failed to fetch user data. Please try again.")
      }
    }
    fetchUser()
  }, [toast])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setLogoPreview(e.target?.result as string)
      reader.readAsDataURL(file)
      form.setValue("logo_url", "placeholder-url-for-upload", { shouldDirty: true, shouldValidate: true })
    } else {
      setLogoPreview(null)
      form.setValue("logo_url", "", { shouldDirty: true, shouldValidate: true })
    }
  }

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setBannerPreview(e.target?.result as string)
      reader.readAsDataURL(file)
      form.setValue("banner_url", "placeholder-url-for-upload", { shouldDirty: true, shouldValidate: true })
    } else {
      setBannerPreview(null)
      form.setValue("banner_url", "", { shouldDirty: true, shouldValidate: true })
    }
  }

  async function onSubmit(data: StoreFormValues) {
    if (!ownerId) {
      toast("Please log in to create a store.")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/stores/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          logo_url: logoPreview,
          banner_url: bannerPreview,
        }),
      })

      if (!res.ok) {
        toast("An unexpected error occurred while creating your store.")
        return
      }

      toast("Your store has been successfully set up.")
      router.push("/store-builder")
    } catch (error) {
      toast("Could not create store. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen py-12 sm:px-6 lg:px-8 ">
      <div className="max-w-3xl mx-auto bg-background/90 backdrop-blur-sm rounded-xl shadow-lg p-4 dark:bg-background/80">
        <AnimatedContainer animation="fadeIn" className="mb-6">
          <div className="flex items-center gap-3 mb-8">
            <div className=" hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
              <StoreIcon className="h-7 w-7 " />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Create Your Store</h1>
              <p className="text-lg text-muted-foreground mt-1">Launch your online presence in minutes</p>
            </div>
          </div>
        </AnimatedContainer>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
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
                        <FormDescription>This is the name customers will see.</FormDescription>
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
                        <FormDescription>This will be your store’s public URL.</FormDescription>
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
                            placeholder="Tell customers what your store is about..."
                            className="resize-none min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>A short description of your store and what you sell.</FormDescription>
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
                    render={() => (
                      <FormItem>
                        <FormLabel>Store Logo</FormLabel>
                        <div className="flex items-center gap-4">
                          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border bg-muted overflow-hidden">
                            {logoPreview ? (
                              <img
                                src={logoPreview || "/placeholder.svg"}
                                alt="Logo preview"
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <StoreIcon className="h-10 w-10 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <Button
                              variant="outline"
                              type="button"
                              className="w-full bg-transparent"
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
                            <FormDescription>Recommended: square image, min 200×200px</FormDescription>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="banner_url"
                    render={() => (
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
                          <Button
                            variant="outline"
                            type="button"
                            className="w-full bg-transparent"
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
                          <FormDescription>Recommended: 1200×400px</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </FormSection>
            </AnimatedContainer>

            <AnimatedContainer animation="fadeIn" delay={0.3}>
              <Card className="border-primary/20 shadow-md dark:border-primary/10">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                          <StoreIcon className="mr-2 h-4 w-4" />
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
    </main>
  )
}
