"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { mockStores } from "@/lib/mock-data"
import { slugify } from "@/lib/utils"

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
  is_published: z.boolean().default(false),
})

type StoreFormValues = z.infer<typeof storeFormSchema>

export default function EditStorePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  // In a real app, we would fetch this data from the API
  const store = mockStores.find((store) => store.id === params.id)

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      is_published: false,
    },
  })

  // Load store data
  useEffect(() => {
    if (store) {
      form.reset({
        name: store.name,
        slug: store.slug,
        description: store.description || "",
        is_published: store.is_published,
      })
    }
  }, [store, form])

  // Generate slug from name
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "name" && value.name) {
        const currentSlug = form.getValues("slug")
        if (!currentSlug || currentSlug === slugify(store?.name || "")) {
          form.setValue("slug", slugify(value.name))
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [form, store])

  async function onSubmit(data: StoreFormValues) {
    setIsLoading(true)

    try {
      // In a real app, we would save to the API
      console.log("Updating store:", data)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Store updated",
        description: "Your store has been updated successfully.",
      })

      router.push("/dashboard/stores")
    } catch (error) {
      console.error("Error updating store:", error)

      toast({
        title: "Error updating store",
        description: "There was an error updating your store. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Store not found</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Edit Store</h2>
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
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
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

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell customers what your store is all about..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>A brief description of your store and what you sell.</FormDescription>
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
                  <CardTitle>Store Appearance</CardTitle>
                  <CardDescription>Customize how your store looks</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Store appearance settings will be available in a future update.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Store Settings</CardTitle>
                  <CardDescription>Advanced settings for your store</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Advanced store settings will be available in a future update.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}
