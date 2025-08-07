"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeft, Loader2, Save } from "lucide-react"

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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Profile schema
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  bio: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// Notification schema
const notificationsFormSchema = z.object({
  marketingEmails: z.boolean(),
  orderUpdates: z.boolean(),
  newProducts: z.boolean(),
})

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false)
  const [user, setUser] = useState({ name: "", email: "" })

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" })
        const data = await res.json()
        if (data?.user) {
          setUser({ name: data.user.name || "", email: data.user.email || "" })
        }
      } catch (err) {
        console.error("Failed to load user", err)
      }
    }
    getUser()
  }, [])

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
    },
  })

  const notificationsForm = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      marketingEmails: false,
      orderUpdates: true,
      newProducts: false,
    },
  })

  useEffect(() => {
    if (user.name || user.email) {
      profileForm.reset({
        name: user.name,
        email: user.email,
        bio: "",
      })
    }
  }, [user, profileForm])

  async function onProfileSubmit(data: ProfileFormValues) {
    setIsProfileLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message);

      toast("Changes saved successfully.");
      router.push("/dashboard/buyer");
    } catch (error: any) {
      toast(error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsProfileLoading(false);
    }
  }


  async function onNotificationsSubmit(data: NotificationsFormValues) {
    setIsNotificationsLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message);

      toast("Notification preferences updated successfully.");
    } catch (error: any) {
      toast(error.message || "Failed to update preferences.");
    } finally {
      setIsNotificationsLoading(false);
    }
  }


  return (
    <div className="space-y-8 py-10">
      <Link href="/dashboard/buyer" className="flex md:hidden items-center mb-4">
        <ChevronLeft className="h-5 w-5 mr-2" /> Back to Dashboard
      </Link>
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your profile information</CardDescription>
            </CardHeader>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormDescription>This is your public display name.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormDescription>This is your email address.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell us about yourself" className="resize-none" {...field} />
                        </FormControl>
                        <FormDescription>This will be displayed on your profile.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isProfileLoading}>
                    {isProfileLoading ? (
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
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <Form {...notificationsForm}>
              <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)}>
                <CardContent className="space-y-4">
                  {(["marketingEmails", "orderUpdates", "newProducts"] as const).map((fieldKey) => (
                    <FormField
                      key={fieldKey}
                      control={notificationsForm.control}
                      name={fieldKey}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {fieldKey === "marketingEmails"
                                ? "Marketing Emails"
                                : fieldKey === "orderUpdates"
                                  ? "Order Updates"
                                  : "New Products"}
                            </FormLabel>
                            <FormDescription>
                              {fieldKey === "marketingEmails"
                                ? "Receive emails about new features and offers."
                                : fieldKey === "orderUpdates"
                                  ? "Get order status updates via email."
                                  : "Get notified about new product drops."}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isNotificationsLoading}>
                    {isNotificationsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
