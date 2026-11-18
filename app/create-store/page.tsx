"use client";
import { Spinner } from "@/components/ui/spinner";

import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageIcon,
  MapPin,
  Pill,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  StoreIcon,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
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
import { toast } from "sonner";
import { slugify, cn } from "@/lib/utils";
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
// Steps + categories
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    title: "Identity",
    heading: "Store identity",
    subtitle: "What is your store called?",
    fields: ["name", "slug", "description", "categories"] as const,
  },
  {
    id: 2,
    title: "Contact",
    heading: "Contact and hours",
    subtitle: "Where customers find you, and when you're open.",
    fields: ["location", "phone"] as const,
  },
  {
    id: 3,
    title: "Branding",
    heading: "Logo and banner",
    subtitle: "Both are required before your store can go live.",
    fields: ["logo_url", "banner_url"] as const,
  },
];

const CATEGORY_OPTIONS: {
  value: StoreCategory;
  label: string;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    value: "restaurants",
    label: "Restaurant",
    icon: UtensilsCrossed,
    description: "Restaurants, cafes, food trucks, cloud kitchens",
  },
  {
    value: "shop",
    label: "Shop",
    icon: ShoppingBag,
    description: "Mini marts, supermarkets, electronics, beauty",
  },
  {
    value: "pharmacy",
    label: "Pharmacy",
    icon: Pill,
    description: "Pharmacies, drug stores, health retailers",
  },
];

const inputClass =
  "h-11 rounded-lg border-border bg-background text-base shadow-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-[#0E5A43] focus-visible:ring-4 focus-visible:ring-[#0E5A43]/10 focus-visible:ring-offset-0 sm:text-sm";

const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0E5A43] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#083B2D] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E5A43]/25 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryBtn =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E5A43]/15 disabled:opacity-60";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E5A43]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

// ─────────────────────────────────────────────────────────────────────────────
// Image helper: shrink big photos before they are stored or sent.
// A 5 MB photo as base64 is ~6.7 MB: too big for localStorage (draft saving) and
// for many hosts' request-size limits. This keeps the look and cuts it to a few
// hundred KB. Falls back to the original if anything goes wrong.
// ─────────────────────────────────────────────────────────────────────────────

async function fileToDataUrl(file: File, maxDimension: number): Promise<string> {
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = original;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const compressed = canvas.toDataURL("image/webp", 0.85);
    return compressed.length < original.length ? compressed : original;
  } catch {
    return original;
  }
}

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
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    DEFAULT_BUSINESS_HOURS
  );
  const [showPreview, setShowPreview] = useState(false);

  const [logoError, setLogoError] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [storeCoords, setStoreCoords] = useState<{ lat: number; lng: number } | null>(null);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

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
    setDraftLoaded(true);
  }, [form]);

  // ── Auto-save form fields ───────────────────────────────────────────────────
  useEffect(() => {
    const sub = form.watch((values) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [form]);

  // ── Auto-save previews (only when an image changes, not on every keystroke) ──
  // Waits for the draft to load first, so it can't overwrite the saved previews.
  useEffect(() => {
    if (!draftLoaded) return;
    try {
      localStorage.setItem(
        PREVIEW_STORAGE_KEY,
        JSON.stringify({ logo: logoPreview, banner: bannerPreview })
      );
    } catch {}
  }, [draftLoaded, logoPreview, bannerPreview]);

  // ── Auto-save hours ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!draftLoaded) return;
    try {
      localStorage.setItem(HOURS_STORAGE_KEY, JSON.stringify(businessHours));
    } catch {}
  }, [draftLoaded, businessHours]);

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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (v: string) => void,
    setError: (v: boolean) => void,
    formField: "logo_url" | "banner_url",
    label: string,
    maxDimension: number
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label} must be less than 5MB`);
      return;
    }
    try {
      const result = await fileToDataUrl(file, maxDimension);
      setPreview(result);
      setError(false);
      form.setValue(formField, "uploaded", { shouldDirty: true });
      toast.success(`${label} uploaded`);
    } catch {
      toast.error(`Could not read that ${label.toLowerCase()} file`);
    }
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
          locationCoords: storeCoords || undefined,
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
  const step = STEPS[currentStep - 1];
  const categoryLabel = CATEGORY_OPTIONS.find(
    (c) => c.value === watchedCategories
  )?.label;

  const previewProps = {
    name: watchedName,
    description: watchedDescription,
    category: categoryLabel,
    location: watchedLocation,
    logo: logoPreview,
    banner: bannerPreview,
  };

  return (
    <main className="min-h-[100dvh] bg-background pb-12">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={() => router.back()}
            className={cn(
              "-ml-1 flex items-center gap-1.5 rounded p-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
              focusRing
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="text-center leading-tight">
            <h1 className="text-sm font-semibold">Create your store</h1>
            <p className="text-xs text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </p>
          </div>

          <div className="flex items-center gap-1">
            {hasDraft && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Discard your draft and start over?")) {
                    clearDraft();
                  }
                }}
                aria-label="Discard draft"
                title="Discard draft"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
                  focusRing
                )}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              aria-pressed={showPreview}
              aria-label="Toggle preview"
              title="Preview"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors lg:hidden",
                showPreview
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
                focusRing
              )}
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8">
        <Stepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onSelect={handleStepClick}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
          <div className="min-w-0 max-w-xl">
            {/* Preview (phones and tablets) */}
            {showPreview && (
              <div className="mb-8 lg:hidden">
                <StorePreview {...previewProps} />
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {step.heading}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{step.subtitle}</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
                {/* STEP 1: identity */}
                {currentStep === 1 && (
                  <>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-sm font-medium">
                            Store name <span className="text-muted-foreground">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Fashion Hub"
                              autoComplete="organization"
                              autoFocus
                              className={inputClass}
                              {...field}
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
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-sm font-medium">
                            Store URL <span className="text-muted-foreground">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-stretch overflow-hidden rounded-lg border border-border transition-colors focus-within:border-[#0E5A43] focus-within:ring-4 focus-within:ring-[#0E5A43]/10">
                              <span className="flex items-center border-r border-border bg-muted/50 px-3 text-sm text-muted-foreground">
                                /stores/
                              </span>
                              <Input
                                className="h-11 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-sm"
                                autoCapitalize="none"
                                autoCorrect="off"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Created from your store name. You can edit it.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-sm font-medium">
                            Description{" "}
                            <span className="font-normal text-muted-foreground">(optional)</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell customers what makes your store special..."
                              className="min-h-[110px] resize-none rounded-lg border-border bg-background text-base shadow-none focus-visible:border-[#0E5A43] focus-visible:ring-4 focus-visible:ring-[#0E5A43]/10 focus-visible:ring-offset-0 sm:text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categories"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-sm font-medium">Store category</FormLabel>
                          <FormControl>
                            <div
                              role="radiogroup"
                              aria-label="Store category"
                              className="grid gap-2.5 pt-0.5"
                            >
                              {CATEGORY_OPTIONS.map((opt) => {
                                const selected = field.value === opt.value;
                                const Icon = opt.icon;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => field.onChange(opt.value)}
                                    className={cn(
                                      "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                                      selected
                                        ? "border-[#0E5A43] bg-[#0E5A43]/5 ring-1 ring-[#0E5A43]"
                                        : "border-border hover:border-foreground/30",
                                      focusRing
                                    )}
                                  >
                                    <Icon
                                      className={cn(
                                        "h-5 w-5 shrink-0",
                                        selected
                                          ? "text-[#0E5A43] dark:text-emerald-400"
                                          : "text-muted-foreground"
                                      )}
                                      strokeWidth={1.75}
                                    />
                                    <span className="min-w-0 flex-1">
                                      <span className="block text-sm font-medium">{opt.label}</span>
                                      <span className="block text-xs text-muted-foreground">
                                        {opt.description}
                                      </span>
                                    </span>
                                    <span
                                      aria-hidden
                                      className={cn(
                                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                                        selected
                                          ? "border-[#0E5A43] bg-[#0E5A43] text-white"
                                          : "border-border"
                                      )}
                                    >
                                      {selected && <Check className="h-3 w-3" />}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* STEP 2: contact and hours */}
                {currentStep === 2 && (
                  <>
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-sm font-medium">
                            Store address <span className="text-muted-foreground">*</span>
                          </FormLabel>
                          <FormControl>
                            <MapAddressPicker
                              value={field.value}
                              onChange={(address) => {
                                field.onChange(address);
                                form.trigger("location");
                              }}
                              onSelect={(coords) => setStoreCoords(coords)}
                              placeholder="Tap to search your store address"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Search, or tap the map to set your address.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-sm font-medium">
                            Business phone{" "}
                            <span className="font-normal text-muted-foreground">
                              (optional, WhatsApp preferred)
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              inputMode="tel"
                              autoComplete="tel"
                              placeholder="+234 800 000 0000"
                              className={inputClass}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Our team will contact you on this number.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="border-t border-border pt-6">
                      <BusinessHoursEditor
                        value={businessHours}
                        onChange={setBusinessHours}
                        showHeading
                      />
                    </div>
                  </>
                )}

                {/* STEP 3: branding */}
                {currentStep === 3 && (
                  <>
                    <ImageUpload
                      variant="logo"
                      label="Store logo"
                      hint="Square image, at least 200×200px. PNG or JPG, up to 5 MB."
                      preview={logoPreview}
                      showError={logoError && !logoPreview}
                      inputRef={logoInputRef}
                      onFile={(e) =>
                        handleFileUpload(e, setLogoPreview, setLogoError, "logo_url", "Logo", 512)
                      }
                      onRemove={() => {
                        setLogoPreview(null);
                        form.setValue("logo_url", "");
                        setLogoError(true);
                      }}
                    />

                    <div className="border-t border-border" />

                    <ImageUpload
                      variant="banner"
                      label="Store banner"
                      hint="Wide image, about 1200×400px. PNG or JPG, up to 5 MB."
                      preview={bannerPreview}
                      showError={bannerError && !bannerPreview}
                      inputRef={bannerInputRef}
                      onFile={(e) =>
                        handleFileUpload(e, setBannerPreview, setBannerError, "banner_url", "Banner", 1600)
                      }
                      onRemove={() => {
                        setBannerPreview(null);
                        form.setValue("banner_url", "");
                        setBannerError(true);
                      }}
                    />
                  </>
                )}

                {/* Navigation */}
                <div className="space-y-3 border-t border-border pt-6">
                  {isLastStep && (
                    <p
                      className={cn(
                        "text-sm",
                        readyToLaunch
                          ? "text-[#0E5A43] dark:text-emerald-400"
                          : "text-muted-foreground"
                      )}
                      aria-live="polite"
                    >
                      {readyToLaunch
                        ? "Everything is ready. You can launch your store."
                        : `Upload ${
                            !logoPreview && !bannerPreview
                              ? "a logo and a banner"
                              : !logoPreview
                                ? "your logo"
                                : "your banner"
                          } to launch.`}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    {currentStep > 1 && (
                      <button type="button" onClick={handleBack} className={secondaryBtn}>
                        <ChevronLeft className="h-4 w-4" /> Back
                      </button>
                    )}

                    {!isLastStep ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className={cn(primaryBtn, "ml-auto")}
                      >
                        Continue <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                          primaryBtn,
                          "ml-auto",
                          !readyToLaunch && "opacity-60"
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner className="h-4 w-4" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Launch store
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </div>

          {/* Live preview (desktop) */}
          <aside className="hidden lg:block" aria-label="Store preview">
            <div className="sticky top-24">
              <StorePreview {...previewProps} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Stepper({
  currentStep,
  completedSteps,
  onSelect,
}: {
  currentStep: number;
  completedSteps: number[];
  onSelect: (id: number) => void;
}) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {STEPS.map((s, index) => {
          const active = currentStep === s.id;
          const complete = completedSteps.includes(s.id);
          const clickable = s.id <= currentStep || complete;
          const last = index === STEPS.length - 1;

          return (
            <li key={s.id} className={cn("flex items-center", !last && "flex-1")}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onSelect(s.id)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded text-sm disabled:cursor-not-allowed",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                  clickable && !active && "hover:text-foreground",
                  focusRing
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    active || complete
                      ? "bg-[#0E5A43] text-white"
                      : "border border-border bg-background text-muted-foreground"
                  )}
                >
                  {complete && !active ? <Check className="h-3.5 w-3.5" /> : s.id}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
                {/* On phones only the current step shows its name */}
                {active && <span className="sm:hidden">{s.title}</span>}
              </button>

              {!last && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-3 h-px flex-1 sm:mx-4",
                    complete ? "bg-[#0E5A43]" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StorePreview({
  name,
  description,
  category,
  location,
  logo,
  banner,
}: {
  name?: string;
  description?: string;
  category?: string;
  location?: string;
  logo: string | null;
  banner: string | null;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Preview</p>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative aspect-[3/1] bg-muted">
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner} alt="Banner preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute -bottom-6 left-4 h-14 w-14 overflow-hidden rounded-xl border-4 border-card bg-muted shadow-sm">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Logo preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <StoreIcon className="h-5 w-5 text-muted-foreground/40" />
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 pt-9">
          <h3 className="truncate text-base font-semibold">
            {name || "Your store name"}
          </h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
          )}
          {(category || location) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {category && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/80">
                  {category}
                </span>
              )}
              {location && (
                <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{location}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageUpload({
  variant,
  label,
  hint,
  preview,
  showError,
  inputRef,
  onFile,
  onRemove,
}: {
  variant: "logo" | "banner";
  label: string;
  hint: string;
  preview: string | null;
  showError: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const open = () => inputRef.current?.click();
  const isLogo = variant === "logo";

  const dropzone = (
    <button
      type="button"
      onClick={open}
      aria-label={preview ? `Change ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
      className={cn(
        "flex items-center justify-center overflow-hidden border-2 border-dashed bg-muted/30 transition-colors",
        isLogo ? "h-24 w-24 shrink-0 rounded-xl" : "aspect-[3/1] w-full rounded-xl",
        showError
          ? "border-destructive/60 bg-destructive/5"
          : preview
            ? "border-solid border-border"
            : "border-border hover:border-[#0E5A43]/50",
        focusRing
      )}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} className="h-full w-full object-cover" />
      ) : isLogo ? (
        <Camera
          className={cn("h-6 w-6", showError ? "text-destructive/60" : "text-muted-foreground")}
          strokeWidth={1.75}
        />
      ) : (
        <span className="flex flex-col items-center gap-1.5 text-center">
          <ImageIcon
            className={cn("h-6 w-6", showError ? "text-destructive/60" : "text-muted-foreground")}
            strokeWidth={1.75}
          />
          <span className="text-xs text-muted-foreground">Click to upload a banner</span>
        </span>
      )}
    </button>
  );

  const actions = (
    <div className="space-y-1.5">
      <div className="flex items-center gap-4 text-sm">
        <button
          type="button"
          onClick={open}
          className={cn(
            "rounded font-medium text-[#0E5A43] hover:underline dark:text-emerald-400",
            focusRing
          )}
        >
          {preview ? "Change" : `Upload ${isLogo ? "logo" : "banner"}`}
        </button>
        {preview && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(
              "rounded text-muted-foreground transition-colors hover:text-destructive",
              focusRing
            )}
          >
            Remove
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {showError && (
        <p className="text-xs text-destructive" role="alert">
          {label} is required to launch.
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {label} <span className="text-muted-foreground">*</span>
        </p>
        {preview && (
          <span className="flex items-center gap-1 text-xs text-[#0E5A43] dark:text-emerald-400">
            <Check className="h-3 w-3" /> Added
          </span>
        )}
      </div>

      {isLogo ? (
        <div className="flex items-center gap-4">
          {dropzone}
          {actions}
        </div>
      ) : (
        <>
          {dropzone}
          {actions}
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}