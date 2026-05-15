"use client";

import type React from "react";
import { useEffect, useState, useCallback } from "react";
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
  X,
  Phone,
  ChevronRight,
  ChevronLeft,
  User,
  AlertCircle,
  Eye,
  ArrowLeft,
  Camera,
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
import { slugify, cn } from "@/lib/utils";
import { AnimatedContainer } from "@/components/ui/animated-container";
import { MapAddressPicker } from "@/components/ui/map-address-picker";
import {
  BusinessHoursEditor,
  BusinessHours,
  DEFAULT_BUSINESS_HOURS,
} from "@/components/business-hours-editor";

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────

const STORE_CATEGORIES = ["restaurants", "shop", "pharmacy"] as const;
type StoreCategory = (typeof STORE_CATEGORIES)[number];

const storeFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Store name must be at least 3 characters." }),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message:
        "Slug can only contain lowercase letters, numbers, and hyphens.",
    }),
  description: z.string().optional(),
  categories: z.enum(STORE_CATEGORIES).optional(),
  location: z.string().min(5, { message: "Please provide a valid address." }),
  phone: z.string().min(7).optional().or(z.literal("")),
  logo_url: z.string().optional(),
  banner_url: z.string().optional(),
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Storage keys
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "create_store_draft";
const PREVIEW_STORAGE_KEY = "create_store_previews";
const HOURS_STORAGE_KEY = "create_store_hours";

// ─────────────────────────────────────────────────────────────────────────────
// Step config
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    title: "Identity",
    fullTitle: "Store Identity",
    subtitle: "Name, URL & description",
    icon: Building2,
    fields: ["name", "slug", "description", "categories"] as const,
  },
  {
    id: 2,
    title: "Contact",
    fullTitle: "Contact & Hours",
    subtitle: "Location, phone & schedule",
    icon: User,
    fields: ["location", "phone"] as const,
  },
  {
    id: 3,
    title: "Branding",
    fullTitle: "Visual Identity",
    subtitle: "Logo & banner required",
    icon: ImageIcon,
    fields: ["logo_url", "banner_url"] as const,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Category options
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: {
  value: StoreCategory;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    value: "restaurants",
    label: "Restaurant",
    emoji: "🍽️",
    description: "Restaurants, cafes, food trucks, cloud kitchens",
  },
  {
    value: "shop",
    label: "Shop",
    emoji: "🛍️",
    description: "Mini marts, supermarkets, electronics, beauty",
  },
  {
    value: "pharmacy",
    label: "Pharmacy",
    emoji: "💊",
    description: "Pharmacies, drug stores, health retailers",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function CreateStorePage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    DEFAULT_BUSINESS_HOURS
  );
  const [showPreview, setShowPreview] = useState(false);

  const [logoError, setLogoError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      categories: undefined,
      location: "",
      phone: "",
      logo_url: "",
      banner_url: "",
    },
    mode: "onChange",
  });

  const watchedName = form.watch("name");
  const watchedDescription = form.watch("description");
  const watchedLocation = form.watch("location");
  const watchedCategories = form.watch("categories");

  // ── Load draft ──────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      const savedPreviews = localStorage.getItem(PREVIEW_STORAGE_KEY);
      const savedHours = localStorage.getItem(HOURS_STORAGE_KEY);
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        Object.keys(d).forEach((k) =>
          form.setValue(k as keyof StoreFormValues, d[k])
        );
        setHasDraft(true);
      }
      if (savedPreviews) {
        const p = JSON.parse(savedPreviews);
        if (p.logo) {
          setLogoPreview(p.logo);
          setLogoError(false);
        }
        if (p.banner) {
          setBannerPreview(p.banner);
          setBannerError(false);
        }
      }
      if (savedHours) setBusinessHours(JSON.parse(savedHours));
    } catch {}
  }, [form]);

  // ── Auto-save form ──────────────────────────────────────────────────────────
  useEffect(() => {
    const sub = form.watch((values) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
        localStorage.setItem(
          PREVIEW_STORAGE_KEY,
          JSON.stringify({ logo: logoPreview, banner: bannerPreview })
        );
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [form, logoPreview, bannerPreview]);

  // ── Auto-save hours ─────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(HOURS_STORAGE_KEY, JSON.stringify(businessHours));
    } catch {}
  }, [businessHours]);

  // ── Auto-slug ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const sub = form.watch((value, { name }) => {
      if (name === "name" && value.name && !form.formState.dirtyFields.slug)
        form.setValue("slug", slugify(value.name), { shouldValidate: true });
    });
    return () => sub.unsubscribe();
  }, [form]);

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();
        if (res.ok && data?.user?._id) setOwnerId(data.user._id);
        else {
          toast.error("Authentication required");
          router.push("/auth/login");
        }
      } catch {
        toast.error("Failed to fetch user data");
      }
    })();
  }, [router]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const clearDraft = useCallback(() => {
    try {
      [STORAGE_KEY, PREVIEW_STORAGE_KEY, HOURS_STORAGE_KEY].forEach((k) =>
        localStorage.removeItem(k)
      );
      form.reset();
      setLogoPreview(null);
      setBannerPreview(null);
      setBusinessHours(DEFAULT_BUSINESS_HOURS);
      setHasDraft(false);
      setCurrentStep(1);
      setCompletedSteps([]);
      setLogoError(false);
      setBannerError(false);
      toast.success("Draft cleared");
    } catch {}
  }, [form]);

  const validateStep = (step: number) =>
    form.trigger(STEPS[step - 1].fields as any);

  const handleNext = async () => {
    if (!(await validateStep(currentStep))) return;
    setCompletedSteps((p) => [...new Set([...p, currentStep])]);
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepClick = async (id: number) => {
    if (id < currentStep) setCurrentStep(id);
    else if (id === currentStep + 1) await handleNext();
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (v: string) => void,
    setError: (v: boolean) => void,
    formField: "logo_url" | "banner_url",
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label} must be less than 5MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const r = ev.target?.result as string;
      setPreview(r);
      setError(false);
      form.setValue(formField, "uploaded", { shouldDirty: true });
      toast.success(`${label} uploaded`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function onSubmit(data: StoreFormValues) {
    if (!ownerId) {
      toast.error("Authentication required");
      return;
    }

    const missingLogo = !logoPreview;
    const missingBanner = !bannerPreview;

    if (missingLogo) setLogoError(true);
    if (missingBanner) setBannerError(true);

    if (missingLogo || missingBanner) {
      if (currentStep !== 3) setCurrentStep(3);
      toast.error(
        missingLogo && missingBanner
          ? "Please upload a logo and banner before launching."
          : missingLogo
            ? "Please upload your store logo before launching."
            : "Please upload your store banner before launching.",
        { description: "They help customers recognise your brand." }
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!(await validateStep(currentStep))) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/seller/store/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          logo_url: logoPreview,
          banner_url: bannerPreview,
          categories: data.categories ? [data.categories] : [],
          businessHours,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error("Failed to create store", { description: result.message });
        return;
      }
      [STORAGE_KEY, PREVIEW_STORAGE_KEY, HOURS_STORAGE_KEY].forEach((k) =>
        localStorage.removeItem(k)
      );
      toast.success("Store created!", {
        description: "Your store is now live.",
      });
      router.push("/store-builder");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLastStep = currentStep === STEPS.length;
  const readyToLaunch = !!logoPreview && !!bannerPreview;
  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <main className="min-h-[100dvh] bg-background pb-8">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1 p-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-[#c0a146] to-[#d4b55e] flex items-center justify-center">
                <StoreIcon className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-sm sm:text-base font-semibold">
                  Create Store
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Step {currentStep}/{STEPS.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasDraft && (
                <button
                  type="button"
                  onClick={clearDraft}
                  className="text-xs text-destructive/70 hover:text-destructive transition-colors p-1"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  showPreview
                    ? "bg-[#c0a146]/10 text-[#c0a146]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 -mx-4 sm:-mx-6 bg-border/30">
            <div
              className="h-full bg-gradient-to-r from-[#c0a146] to-[#d4b55e] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8">
        {/* ── Step pills ──────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-5 sm:mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isComplete = completedSteps.includes(step.id);
            const clickable = step.id <= currentStep || isComplete;
            const StepIcon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && handleStepClick(step.id)}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 flex-1 justify-center min-w-0",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  isActive
                    ? "bg-gradient-to-r from-[#c0a146] to-[#d4b55e] text-white shadow-md shadow-[#c0a146]/25"
                    : isComplete
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-muted/50 text-muted-foreground border border-border/50"
                )}
              >
                {isComplete ? (
                  <Check className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                  <StepIcon className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                <span className="truncate">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* ── Live preview card ────────────────────────────────────────────── */}
        {showPreview && (
          <AnimatedContainer animation="slideUp" className="mb-5 sm:mb-6">
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
              {/* Banner */}
              <div className="aspect-[3/1] bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
                {/* Logo overlay */}
                <div className="absolute -bottom-5 left-4 sm:left-5">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl border-[3px] border-card bg-muted overflow-hidden shadow-lg">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <StoreIcon className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Info */}
              <div className="pt-8 pb-4 px-4 sm:px-5">
                <h3 className="font-semibold text-sm sm:text-base truncate">
                  {watchedName || "Your Store Name"}
                </h3>
                {watchedDescription && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {watchedDescription}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {watchedCategories && (
                    <span className="text-[10px] sm:text-xs bg-[#c0a146]/10 text-[#c0a146] px-2 py-0.5 rounded-full font-medium">
                      {
                        CATEGORY_OPTIONS.find(
                          (c) => c.value === watchedCategories
                        )?.label
                      }
                    </span>
                  )}
                  {watchedLocation && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">
                        {watchedLocation}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </AnimatedContainer>
        )}

        {/* ── Form ───────────────────────────────────────────────────────────── */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* STEP 1 — Store Identity */}
            {currentStep === 1 && (
              <AnimatedContainer animation="slideUp" delay={0.05}>
                <Card className="border border-border/50 shadow-sm bg-card">
                  <CardContent className="p-4 sm:p-6 space-y-5">
                    <SectionHeading
                      icon={Building2}
                      title="Store Identity"
                      subtitle="What is your store called?"
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Store Name{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <IconInput
                              icon={StoreIcon}
                              placeholder="e.g., Fashion Hub"
                              field={field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Store URL{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-stretch overflow-hidden rounded-xl border border-border/50 focus-within:border-[#c0a146] focus-within:ring-1 focus-within:ring-[#c0a146]/20 transition-all">
                              <div className="flex items-center px-2.5 sm:px-3 bg-muted/50 border-r border-border/50">
                                <Link2 className="h-3.5 w-3.5 text-muted-foreground sm:mr-1.5 flex-shrink-0" />
                                <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                                  /stores/
                                </span>
                              </div>
                              <Input
                                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-11 sm:h-12 text-sm"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-[10px] sm:text-xs">
                            Auto-generated from your store name
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
                          <FormLabel className="text-xs sm:text-sm">
                            Description
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Textarea
                                placeholder="Tell customers what makes your store special..."
                                className="pl-10 min-h-[100px] sm:min-h-[110px] rounded-xl border-border/50 focus:border-[#c0a146] focus-visible:ring-1 focus-visible:ring-[#c0a146]/20 focus-visible:ring-offset-0 resize-none transition-all text-sm"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Category selector */}
                    <FormField
                      control={form.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Store Category
                          </FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-1 gap-2.5 mt-1">
                              {CATEGORY_OPTIONS.map((opt) => {
                                const isSelected = field.value === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => field.onChange(opt.value)}
                                    className={cn(
                                      "flex items-center gap-3 sm:gap-4 w-full rounded-xl border-2 px-3 sm:px-4 py-3 text-left transition-all duration-200 active:scale-[0.98]",
                                      isSelected
                                        ? "border-[#c0a146] bg-[#c0a146]/5 shadow-sm shadow-[#c0a146]/10"
                                        : "border-border/50 hover:border-[#c0a146]/40 hover:bg-muted/30"
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 transition-colors",
                                        isSelected
                                          ? "bg-[#c0a146]/15"
                                          : "bg-muted/50"
                                      )}
                                    >
                                      {opt.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className={cn(
                                          "text-sm font-semibold leading-tight",
                                          isSelected
                                            ? "text-[#c0a146]"
                                            : "text-foreground"
                                        )}
                                      >
                                        {opt.label}
                                      </p>
                                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                        {opt.description}
                                      </p>
                                    </div>
                                    <div
                                      className={cn(
                                        "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                        isSelected
                                          ? "border-[#c0a146] bg-[#c0a146]"
                                          : "border-border"
                                      )}
                                    >
                                      {isSelected && (
                                        <Check className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </FormControl>
                          <FormDescription className="text-[10px] sm:text-xs">
                            Choose the category that best describes your store
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </AnimatedContainer>
            )}

            {/* STEP 2 — Contact & Hours */}
            {currentStep === 2 && (
              <AnimatedContainer animation="slideUp" delay={0.05}>
                <Card className="border border-border/50 shadow-sm bg-card">
                  <CardContent className="p-4 sm:p-6 space-y-5">
                    <SectionHeading
                      icon={User}
                      title="Contact & Hours"
                      subtitle="Location, phone & opening times"
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Store Address{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <MapAddressPicker
                              value={field.value}
                              onChange={(address) => {
                                field.onChange(address);
                                form.trigger("location");
                              }}
                              placeholder="Tap to search your store address"
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] sm:text-xs">
                            Search or tap the map to set your address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Business Phone
                            <span className="ml-1.5 text-[10px] sm:text-xs font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 sm:px-2 py-0.5 rounded-full inline-flex items-center">
                              WhatsApp preferred
                            </span>
                          </FormLabel>
                          <FormControl>
                            <IconInput
                              icon={Phone}
                              placeholder="+234 800 000 0000"
                              field={field}
                              type="tel"
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] sm:text-xs">
                            Admin will contact you on this number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="border-t border-border/40 pt-5">
                      <BusinessHoursEditor
                        value={businessHours}
                        onChange={setBusinessHours}
                        showHeading
                      />
                    </div>
                  </CardContent>
                </Card>
              </AnimatedContainer>
            )}

            {/* STEP 3 — Visual Identity */}
            {currentStep === 3 && (
              <AnimatedContainer animation="slideUp" delay={0.05}>
                <Card className="border border-border/50 shadow-sm bg-card">
                  <CardContent className="p-4 sm:p-6 space-y-5">
                    <SectionHeading
                      icon={ImageIcon}
                      title="Visual Identity"
                      subtitle="Logo & banner are required to launch"
                    />

                    <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 px-3 sm:px-4 py-2.5 sm:py-3">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        Both a <strong>logo</strong> and{" "}
                        <strong>banner</strong> must be uploaded before your
                        store can go live.
                      </p>
                    </div>

                    {/* ── Logo ── */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-medium">
                          Store Logo{" "}
                          <span className="text-destructive">*</span>
                        </p>
                        {logoPreview && (
                          <span className="text-[10px] sm:text-xs text-emerald-600 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Uploaded
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="relative group flex-shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              document.getElementById("logo-upload")?.click()
                            }
                            className={cn(
                              "h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-dashed bg-muted/30 overflow-hidden flex items-center justify-center transition-all active:scale-95",
                              logoError && !logoPreview
                                ? "border-destructive/60 bg-destructive/5"
                                : logoPreview
                                  ? "border-emerald-400/60"
                                  : "border-border/60 hover:border-[#c0a146]/50"
                            )}
                          >
                            {logoPreview ? (
                              <img
                                src={logoPreview}
                                alt="Logo"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="text-center p-2">
                                <Camera
                                  className={cn(
                                    "h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1",
                                    logoError
                                      ? "text-destructive/50"
                                      : "text-muted-foreground"
                                  )}
                                />
                                <p
                                  className={cn(
                                    "text-[9px] sm:text-[10px]",
                                    logoError
                                      ? "text-destructive/70 font-medium"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {logoError ? "Required" : "Tap to add"}
                                </p>
                              </div>
                            )}
                          </button>
                          {logoPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                setLogoPreview(null);
                                form.setValue("logo_url", "");
                                setLogoError(true);
                              }}
                              className="absolute -top-1.5 -right-1.5 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <Button
                            variant="outline"
                            type="button"
                            size="sm"
                            className={cn(
                              "w-full h-10 sm:h-11 rounded-xl transition-colors text-xs sm:text-sm",
                              logoError && !logoPreview
                                ? "border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/5"
                                : "border-border/50 hover:border-[#c0a146]/50 hover:bg-[#c0a146]/5"
                            )}
                            onClick={() =>
                              document.getElementById("logo-upload")?.click()
                            }
                          >
                            <Upload className="mr-2 h-3.5 w-3.5" />
                            {logoPreview ? "Change Logo" : "Upload Logo"}
                          </Button>
                          {logoError && !logoPreview && (
                            <p className="text-[10px] sm:text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 flex-shrink-0" />
                              Logo is required to launch
                            </p>
                          )}
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center">
                            200x200px &middot; PNG/JPG &middot; Max 5MB
                          </p>
                        </div>
                      </div>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(
                            e,
                            setLogoPreview,
                            setLogoError,
                            "logo_url",
                            "Logo"
                          )
                        }
                      />
                    </div>

                    <div className="border-t border-border/40" />

                    {/* ── Banner ── */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-medium">
                          Store Banner{" "}
                          <span className="text-destructive">*</span>
                        </p>
                        {bannerPreview && (
                          <span className="text-[10px] sm:text-xs text-emerald-600 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Uploaded
                          </span>
                        )}
                      </div>

                      <div className="relative group">
                        <button
                          type="button"
                          onClick={() =>
                            document.getElementById("banner-upload")?.click()
                          }
                          className={cn(
                            "aspect-[3/1] w-full rounded-xl border-2 border-dashed bg-muted/30 overflow-hidden flex items-center justify-center transition-all active:scale-[0.99]",
                            bannerError && !bannerPreview
                              ? "border-destructive/60 bg-destructive/5"
                              : bannerPreview
                                ? "border-emerald-400/60"
                                : "border-border/60 hover:border-[#c0a146]/50"
                          )}
                        >
                          {bannerPreview ? (
                            <img
                              src={bannerPreview}
                              alt="Banner"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-4">
                              <ImageIcon
                                className={cn(
                                  "h-6 w-6 sm:h-7 sm:w-7 mx-auto mb-1.5",
                                  bannerError
                                    ? "text-destructive/50"
                                    : "text-muted-foreground"
                                )}
                              />
                              <p
                                className={cn(
                                  "text-[10px] sm:text-xs",
                                  bannerError
                                    ? "text-destructive/70 font-medium"
                                    : "text-muted-foreground"
                                )}
                              >
                                {bannerError
                                  ? "Banner is required"
                                  : "Tap to upload banner"}
                              </p>
                            </div>
                          )}
                        </button>
                        {bannerPreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setBannerPreview(null);
                              form.setValue("banner_url", "");
                              setBannerError(true);
                            }}
                            className="absolute top-2 right-2 h-7 w-7 bg-destructive text-white rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        className={cn(
                          "w-full h-10 sm:h-11 rounded-xl transition-colors text-xs sm:text-sm",
                          bannerError && !bannerPreview
                            ? "border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/5"
                            : "border-border/50 hover:border-[#c0a146]/50 hover:bg-[#c0a146]/5"
                        )}
                        onClick={() =>
                          document.getElementById("banner-upload")?.click()
                        }
                      >
                        <Upload className="mr-2 h-3.5 w-3.5" />
                        {bannerPreview ? "Change Banner" : "Upload Banner"}
                      </Button>

                      {bannerError && !bannerPreview && (
                        <p className="text-[10px] sm:text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          Banner is required to launch
                        </p>
                      )}
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center">
                        1200x400px &middot; PNG/JPG &middot; Max 5MB
                      </p>
                      <input
                        id="banner-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(
                            e,
                            setBannerPreview,
                            setBannerError,
                            "banner_url",
                            "Banner"
                          )
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </AnimatedContainer>
            )}

            {/* ── Navigation ─────────────────────────────────────────────────── */}
            <AnimatedContainer animation="fadeIn" delay={0.1}>
              {/* Status message */}
              <div className="text-center mb-3">
                {isLastStep ? (
                  !readyToLaunch ? (
                    <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Upload{" "}
                      {!logoPreview && !bannerPreview
                        ? "a logo & banner"
                        : !logoPreview
                          ? "your logo"
                          : "your banner"}{" "}
                      to enable launch
                    </p>
                  ) : (
                    <p className="text-[10px] sm:text-xs text-emerald-600 flex items-center justify-center gap-1">
                      <Check className="h-3 w-3" /> Ready to launch!
                    </p>
                  )
                ) : (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {STEPS.length - currentStep} step
                    {STEPS.length - currentStep > 1 ? "s" : ""} remaining
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleBack}
                    className="h-12 sm:h-13 px-4 sm:px-6 rounded-xl border-2 hover:border-[#c0a146]/50 hover:bg-[#c0a146]/5 active:scale-[0.98] transition-all text-sm"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                )}

                {!isLastStep ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleNext}
                    className="flex-1 h-12 sm:h-13 px-6 rounded-xl bg-gradient-to-r from-[#c0a146] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#c0a146] text-white shadow-lg shadow-[#c0a146]/20 hover:shadow-xl active:scale-[0.98] transition-all duration-300 text-sm sm:text-base font-medium"
                  >
                    Continue <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className={cn(
                      "flex-1 h-12 sm:h-13 px-6 rounded-xl text-white shadow-lg transition-all duration-300 text-sm sm:text-base font-medium active:scale-[0.98]",
                      readyToLaunch
                        ? "bg-gradient-to-r from-[#c0a146] to-[#d4b55e] hover:from-[#d4b55e] hover:to-[#c0a146] shadow-[#c0a146]/20 hover:shadow-xl"
                        : "bg-gradient-to-r from-[#c0a146]/50 to-[#d4b55e]/50 cursor-not-allowed opacity-70"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Launch Store
                      </>
                    )}
                  </Button>
                )}
              </div>
            </AnimatedContainer>
          </form>
        </Form>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-[#c0a146]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#c0a146]" />
      </div>
      <div>
        <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function IconInput({
  icon: Icon,
  placeholder,
  field,
  type = "text",
}: {
  icon: React.ElementType;
  placeholder: string;
  field: any;
  type?: string;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type={type}
        placeholder={placeholder}
        className="pl-10 h-11 sm:h-12 rounded-xl border-border/50 focus:border-[#c0a146] focus-visible:ring-1 focus-visible:ring-[#c0a146]/20 focus-visible:ring-offset-0 transition-all text-sm"
        {...field}
      />
    </div>
  );
}
