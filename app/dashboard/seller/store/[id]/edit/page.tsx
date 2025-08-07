"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { slugify } from "@/lib/utils"

const storeFormSchema = z.object({
  name: z.string().min(3, { message: "Store name must be at least 3 characters." }),
  slug: z
    .string()
    .min(3, { message: "Store slug must be at least 3 characters." })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Slug can only contain lowercase letters, numbers, and hyphens." }),
  description: z.string().optional(),
  isPublished: z.boolean(),
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
})

type StoreFormValues = z.infer<typeof storeFormSchema>

export default function EditStorePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isPublished: false,
      logo_url: "",
      banner_url: "",
    },
  })

  // Convert file to base64
  const fileToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })
  }

  // Fetch store data
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await fetch(`/api/seller/store/${params.id}`)
        if (!res.ok) return

        const data = await res.json()
        const store = data.store

        form.reset({
          name: store.name,
          slug: store.slug,
          description: store.description || "",
          isPublished: store.isPublished,
          logo_url: store.logo_url || "",
          banner_url: store.banner_url || "",
        })
      } catch (error) {
        console.error(error)
      }
    }
    fetchStore()
  }, [params.id, form])

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "name" && value.name && !form.formState.dirtyFields.slug) {
        form.setValue("slug", slugify(value.name), { shouldValidate: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  async function onSubmit(data: StoreFormValues) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/seller/store/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error("Failed to update store")

      toast("Store updated successfully." )
      router.push("/dashboard/seller")
    } catch (error) {
      console.error(error)
      toast("Error updating store." )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        
          <h2 className="text-3xl font-bold tracking-tight">Edit Store</h2>
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
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>Basic information about your store</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>This is the name that customers will see.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Slug */}
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store URL</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <span className="text-muted-foreground mr-2">shopbuilder.com/stores/</span>
                            <Input {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>This is the URL where customers can find your store.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell customers about your store..." className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Visibility */}
                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Store Visibility</FormLabel>
                          <FormDescription>When enabled, your store will be visible to customers.</FormDescription>
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

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Store Images</CardTitle>
                  <CardDescription>Upload your store logo and banner</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Logo */}
                  <FormField
                    control={form.control}
                    name="logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const base64 = await fileToBase64(file)
                                field.onChange(base64)
                              }
                            }}
                          />
                        </FormControl>
                        {field.value && (
                          <img src={field.value} alt="Logo" className="h-16 mt-2 rounded border" />
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Banner */}
                  <FormField
                    control={form.control}
                    name="banner_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banner</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const base64 = await fileToBase64(file)
                                field.onChange(base64)
                              }
                            }}
                          />
                        </FormControl>
                        {field.value && (
                          <img src={field.value} alt="Banner" className="h-32 w-full object-cover mt-2 rounded border" />
                        )}
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
