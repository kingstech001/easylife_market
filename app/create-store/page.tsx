"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  StoreIcon,
  Building2,
  ImageIcon,
  Upload,
  Check,
  RotateCcw,
  MapPin,
  Link2,
  FileText,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { slugify } from "@/lib/utils";
import { AnimatedContainer } from "@/components/ui/animated-container";

const storeFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Store name must be at least 3 characters." }),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens.",
    }),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
  categories: z.string().optional(),
  location: z
    .string()
    .min(5, { message: "Please provide a valid address for your store." }),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

const STORAGE_KEY = "create_store_draft";
const PREVIEW_STORAGE_KEY = "create_store_previews";

export default function CreateStorePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logo_url: "",
      banner_url: "",
      categories: "",
      location: "",
    },
  });

  // Load saved draft on mount
  useEffect(() => {
    const loadDraft = () => {
      try {
        const savedDraft = localStorage.getItem(STORAGE_KEY);
        const savedPreviews = localStorage.getItem(PREVIEW_STORAGE_KEY);

        if (savedDraft) {
          const draftData = JSON.parse(savedDraft);

          Object.keys(draftData).forEach((key) => {
            form.setValue(key as keyof StoreFormValues, draftData[key]);
          });

          setHasDraft(true);
          console.log("✅ Draft loaded");
        }

        if (savedPreviews) {
          const previewData = JSON.parse(savedPreviews);
          if (previewData.logo) setLogoPreview(previewData.logo);
          if (previewData.banner) setBannerPreview(previewData.banner);
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    };

    loadDraft();
  }, [form]);

  // Auto-save form data
  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
        localStorage.setItem(
          PREVIEW_STORAGE_KEY,
          JSON.stringify({
            logo: logoPreview,
            banner: bannerPreview,
          }),
        );
      } catch (error) {
        console.error("Failed to save draft:", error);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, logoPreview, bannerPreview]);

  // Auto-generate slug
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "name" && value.name && !form.formState.dirtyFields.slug) {
        form.setValue("slug", slugify(value.name), { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Get user authentication
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();
        if (res.ok && data?.user?._id) {
          setOwnerId(data.user._id);
        } else {
          toast.error("Authentication required", {
            description: "Please log in to create a store.",
          });
          router.push("/auth/login");
        }
      } catch (err) {
        toast.error("Failed to fetch user data", {
          description: "Please try again later.",
        });
      }
    };
    fetchUser();
  }, [router]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Logo must be less than 5MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        localStorage.setItem(
          PREVIEW_STORAGE_KEY,
          JSON.stringify({ logo: result, banner: bannerPreview }),
        );
        toast.success("Logo uploaded successfully");
      };
      reader.readAsDataURL(file);
      form.setValue("logo_url", "placeholder-url-for-upload", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Banner must be less than 5MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBannerPreview(result);
        localStorage.setItem(
          PREVIEW_STORAGE_KEY,
          JSON.stringify({ logo: logoPreview, banner: result }),
        );
        toast.success("Banner uploaded successfully");
      };
      reader.readAsDataURL(file);
      form.setValue("banner_url", "placeholder-url-for-upload", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PREVIEW_STORAGE_KEY);
      form.reset();
      setLogoPreview(null);
      setBannerPreview(null);
      setHasDraft(false);
      toast.success("Draft cleared", {
        description: "All saved data has been removed.",
      });
    } catch (error) {
      console.error("Failed to clear draft:", error);
      toast.error("Failed to clear draft");
    }
  };

  async function onSubmit(data: StoreFormValues) {
    if (!ownerId) {
      toast.error("Authentication required", {
        description: "Please log in to create a store.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const categoriesArray = data.categories
        ? data.categories
            .split(",")
            .map((cat) => cat.trim())
            .filter(Boolean)
        : [];

      const res = await fetch("/api/dashboard/seller/store/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          logo_url: logoPreview,
          banner_url: bannerPreview,
          categories: categoriesArray,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Failed to create store", {
          description:
            result.message || "Unable to create your store. Please try again.",
        });
        return;
      }

      // Clear draft after successful submission
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PREVIEW_STORAGE_KEY);

      toast.success("Store created successfully!", {
        description: "Your store is now live and ready to use.",
      });

      // Redirect to store builder
      router.push("/store-builder");
    } catch (error) {
      console.error("Store creation error:", error);
      toast.error("An unexpected error occurred", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-6 sm:py-8 px-3 sm:px-4 lg:px-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#c0a146]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-[#c0a146]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header Section */}
        <AnimatedContainer animation="fadeIn" className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#c0a146] to-[#d4b55e] flex items-center justify-center shadow-xl">
                  <StoreIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-emerald-500 rounded-full border-2 sm:border-4 border-background" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Create Your Store
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-[#c0a146]" />
                  Build your online presence
                </p>
              </div>
            </div>

            {hasDraft && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearDraft}
                className="gap-1 sm:gap-2 text-xs sm:text-sm border-destructive/50 text-destructive hover:bg-destructive/10 h-9 px-3 sm:px-4"
              >
                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Clear Draft</span>
                <span className="xs:hidden">Clear</span>
              </Button>
            )}
          </div>

          {hasDraft && (
            <Card className="border-[#c0a146]/30 bg-gradient-to-r from-[#c0a146]/5 to-transparent">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#c0a146]/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-[#c0a146]" />
                  </div>
                  <div>
                    <p className="font-medium text-xs sm:text-sm">
                      Draft Saved
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Your progress is automatically saved
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </AnimatedContainer>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6"
          >
            {/* Store Information Card */}
            <AnimatedContainer animation="slideUp" delay={0.1}>
              <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/95">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold">
                        Store Information
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground hidden xs:block">
                        Essential details about your business
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-medium">
                            Store Name
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <StoreIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                              <Input
                                placeholder="e.g., Fashion Hub"
                                className="pl-10 sm:pl-11 h-11 sm:h-12 text-sm sm:text-base border-border/50 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-2 focus:ring-[#c0a146]/20 focus:border-[#c0a146] transition-colors"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs sm:text-sm">
                            Choose a memorable name for your customers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-medium">
                            Store URL
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-stretch overflow-hidden rounded-lg border border-border/50 focus-within:border-[#c0a146] focus-within:ring-2 focus-within:ring-[#c0a146]/20 transition-all">
                              <div className="flex items-center px-2 sm:px-4 bg-muted/50 border-r">
                                <Link2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mr-1 sm:mr-2 flex-shrink-0" />
                                <span className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap hidden xs:inline">
                                  shopbuilder.com/stores/
                                </span>
                                <span className="text-xs text-muted-foreground xs:hidden">
                                  .../
                                </span>
                              </div>
                              <Input
                                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-11 sm:h-12 text-sm sm:text-base"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs sm:text-sm">
                            Your unique store address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-medium">
                            Store Address
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                              <Input
                                placeholder="123 Main St, City"
                                className="pl-10 sm:pl-11 h-11 sm:h-12 text-sm sm:text-base border-border/50 focus:border-[#c0a146] transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs sm:text-sm">
                            Your physical business location
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-medium">
                            Store Description
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FileText className="absolute left-3 top-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                              <Textarea
                                placeholder="Tell customers what makes your store special..."
                                className="pl-10 sm:pl-11 min-h-[120px] sm:min-h-[140px] text-sm sm:text-base border-border/50 focus:border-[#c0a146] transition-colors resize-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs sm:text-sm hidden sm:block">
                            A compelling description helps customers understand
                            your brand
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-medium">
                            Product Categories
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                              <Input
                                placeholder="Electronics, Fashion"
                                className="pl-10 sm:pl-11 h-11 sm:h-12 text-sm sm:text-base border-border/50 focus:border-[#c0a146] transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs sm:text-sm">
                            Separate with commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </AnimatedContainer>

            {/* Store Branding Card */}
            <AnimatedContainer animation="slideUp" delay={0.2}>
              <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-card/95">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold">
                        Visual Identity
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground hidden xs:block">
                        Make your store recognizable
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                    {/* Logo Upload */}
                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-medium">
                            Store Logo
                          </FormLabel>
                          <div className="space-y-3 sm:space-y-4">
                            <div className="relative group">
                              <div className="h-32 w-32 sm:h-40 sm:w-40 mx-auto rounded-xl sm:rounded-2xl border-2 border-dashed border-border/50 bg-muted/30 overflow-hidden flex items-center justify-center transition-all group-hover:border-[#c0a146]/50">
                                {logoPreview ? (
                                  <>
                                    <img
                                      src={logoPreview}
                                      alt="Logo preview"
                                      className="h-full w-full object-cover"
                                    />
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="destructive"
                                      className="absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => {
                                        setLogoPreview(null);
                                        form.setValue("logo_url", "");
                                        toast.success("Logo removed");
                                      }}
                                    >
                                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <div className="text-center p-3 sm:p-4">
                                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-1 sm:mb-2" />
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                      Click to upload
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              type="button"
                              className="w-full h-10 sm:h-11 text-sm border-border/50 hover:border-[#c0a146]/50 hover:bg-[#c0a146]/5 transition-colors"
                              onClick={() =>
                                document.getElementById("logo-upload")?.click()
                              }
                            >
                              <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              {logoPreview ? "Change Logo" : "Upload Logo"}
                            </Button>
                            <input
                              id="logo-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoUpload}
                            />
                            <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                              <span className="hidden sm:inline">
                                Recommended: 200×200px, PNG or JPG (Max 5MB)
                              </span>
                              <span className="sm:hidden">
                                PNG/JPG, Max 5MB
                              </span>
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Banner Upload */}
                    <FormField
                      control={form.control}
                      name="banner_url"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-medium">
                            Store Banner
                          </FormLabel>
                          <div className="space-y-3 sm:space-y-4">
                            <div className="relative group">
                              <div className="aspect-[2/1] w-full rounded-lg sm:rounded-xl border-2 border-dashed border-border/50 bg-muted/30 overflow-hidden flex items-center justify-center transition-all group-hover:border-[#c0a146]/50">
                                {bannerPreview ? (
                                  <>
                                    <img
                                      src={bannerPreview}
                                      alt="Banner preview"
                                      className="h-full w-full object-cover"
                                    />
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="destructive"
                                      className="absolute top-2 right-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => {
                                        setBannerPreview(null);
                                        form.setValue("banner_url", "");
                                        toast.success("Banner removed");
                                      }}
                                    >
                                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <div className="text-center p-3 sm:p-4">
                                    <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground mx-auto mb-1 sm:mb-2" />
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                                      Click to upload
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              type="button"
                              className="w-full h-10 sm:h-11 text-sm border-border/50 hover:border-[#c0a146]/50 hover:bg-[#c0a146]/5 transition-colors"
                              onClick={() =>
                                document
                                  .getElementById("banner-upload")
                                  ?.click()
                              }
                            >
                              <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              {bannerPreview
                                ? "Change Banner"
                                : "Upload Banner"}
                            </Button>
                            <input
                              id="banner-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleBannerUpload}
                            />
                            <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                              <span className="hidden sm:inline">
                                Recommended: 1200x600px, PNG or JPG (Max 5MB)
                              </span>
                              <span className="sm:hidden">
                                PNG/JPG, Max 5MB
                              </span>
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </AnimatedContainer>

            {/* Submit Section */}
            <AnimatedContainer animation="fadeIn" delay={0.3}>
              <Card className="border-[#c0a146]/30 shadow-xl backdrop-blur-sm bg-gradient-to-br from-card/95 to-card/80">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm sm:text-base">
                          Ready to Launch
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Your store setup is complete
                        </p>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="lg"
                      className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base bg-gradient-to-r from-[#c0a146] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#c0a146] text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          <span className="hidden xs:inline">
                            Creating Store...
                          </span>
                          <span className="xs:hidden">Creating...</span>
                        </>
                      ) : (
                        <>
                          <StoreIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
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
  );
}
